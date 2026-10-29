package com.billease.service

import cats.effect.IO
import cats.syntax.all.*
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import com.billease.domain.*
import java.util.UUID
import java.time.LocalDate
import scala.util.Try

class ProductService(xa: Transactor[IO]):

  private def combineWhere(filters: List[Option[Fragment]]): Fragment =
    filters.flatten match
      case Nil => fr""
      case head :: tail => fr"WHERE " ++ tail.foldLeft(head)((acc, f) => acc ++ fr" AND " ++ f)

  def listProductsPaged(
      tenantId: UUID,
      qOpt: Option[String] = None,
      categoryIdOpt: Option[UUID] = None,
      inStockOnlyOpt: Option[Boolean] = None,
      page: Int = 1,
      limit: Int = 50
  ): IO[PagedProducts] =
    val safePage = page.max(1)
    val safeLimit = limit.max(1).min(500)
    val offset = (safePage - 1) * safeLimit

    val filterFragments = List(
      Some(fr"p.tenant_id = $tenantId"),
      Some(fr"p.is_active = true"),
      qOpt.filter(_.trim.nonEmpty).map { q =>
        val wildcard = s"%${q.trim}%"
        fr"(p.name ILIKE $wildcard OR p.barcode ILIKE $wildcard OR p.sku ILIKE $wildcard)"
      },
      categoryIdOpt.map(cid => fr"p.category_id = $cid")
    )
    val whereClause = combineWhere(filterFragments)

    val havingClause = inStockOnlyOpt match
      case Some(true) => fr"HAVING COALESCE(SUM(b.quantity), 0) > 0"
      case _ => fr""

    val countQuery =
      (fr"""
        SELECT COUNT(*) FROM (
          SELECT p.id
          FROM products p
          LEFT JOIN product_batches b ON p.id = b.product_id
      """ ++ whereClause ++ fr"GROUP BY p.id " ++ havingClause ++ fr") sub").query[Long].unique

    val dataQuery =
      (fr"""
        SELECT p.id, p.tenant_id, p.category_id, p.name, p.barcode, p.sku, p.unit,
               p.hsn_code, p.gst_rate, p.is_price_tax_inclusive, p.min_stock_alert, p.is_active,
               COALESCE(SUM(b.quantity), 0) as current_stock,
               COALESCE(MAX(b.mrp), 0) as mrp,
               COALESCE(MAX(b.selling_price), 0) as selling_price
        FROM products p
        LEFT JOIN product_batches b ON p.id = b.product_id
      """ ++ whereClause ++ fr"GROUP BY p.id " ++ havingClause ++
        fr"ORDER BY p.name ASC LIMIT $safeLimit OFFSET $offset").query[Product].to[List]

    for
      total <- countQuery.transact(xa)
      items <- dataQuery.transact(xa)
      totalPages = if total == 0 then 1 else Math.ceil(total.toDouble / safeLimit).toInt
    yield PagedProducts(items, total, safePage, safeLimit, totalPages)

  def listProducts(tenantId: UUID): IO[List[Product]] =
    sql"""
      SELECT p.id, p.tenant_id, p.category_id, p.name, p.barcode, p.sku, p.unit,
             p.hsn_code, p.gst_rate, p.is_price_tax_inclusive, p.min_stock_alert, p.is_active,
             COALESCE(SUM(b.quantity), 0) as current_stock,
             COALESCE(MAX(b.mrp), 0) as mrp,
             COALESCE(MAX(b.selling_price), 0) as selling_price
      FROM products p
      LEFT JOIN product_batches b ON p.id = b.product_id
      WHERE p.tenant_id = $tenantId AND p.is_active = true
      GROUP BY p.id
      ORDER BY p.name ASC
    """.query[Product].to[List].transact(xa)

  def searchProducts(tenantId: UUID, query: String): IO[List[Product]] =
    val wildcard = s"%$query%"
    sql"""
      SELECT p.id, p.tenant_id, p.category_id, p.name, p.barcode, p.sku, p.unit,
             p.hsn_code, p.gst_rate, p.is_price_tax_inclusive, p.min_stock_alert, p.is_active,
             COALESCE(SUM(b.quantity), 0) as current_stock,
             COALESCE(MAX(b.mrp), 0) as mrp,
             COALESCE(MAX(b.selling_price), 0) as selling_price
      FROM products p
      LEFT JOIN product_batches b ON p.id = b.product_id
      WHERE p.tenant_id = $tenantId AND p.is_active = true
        AND (p.name ILIKE $wildcard OR p.barcode ILIKE $wildcard OR p.sku ILIKE $wildcard)
      GROUP BY p.id
      ORDER BY p.name ASC
      LIMIT 20
    """.query[Product].to[List].transact(xa)

  def createProduct(tenantId: UUID, req: ProductCreate): IO[Product] =
    val productId = UUID.randomUUID()
    val batchId = UUID.randomUUID()
    val hsn = req.hsnCode.getOrElse("")
    val batchNo = req.batchNo.getOrElse("BATCH-01")
    val expDate = req.expiryDate.flatMap(s => Try(LocalDate.parse(s)).toOption)

    val insertProduct = sql"""
      INSERT INTO products (
        id, tenant_id, category_id, name, barcode, sku, unit, hsn_code,
        gst_rate, is_price_tax_inclusive, min_stock_alert, is_active
      ) VALUES (
        $productId, $tenantId, ${req.categoryId}, ${req.name}, ${req.barcode}, ${req.sku},
        ${req.unit}, $hsn, ${req.gstRate}, ${req.isPriceTaxInclusive}, ${req.minStockAlert}, true
      )
    """.update.run

    val insertBatch = sql"""
      INSERT INTO product_batches (
        id, tenant_id, product_id, batch_no, mfg_date, expiry_date,
        mrp, cost_price, selling_price, quantity
      ) VALUES (
        $batchId, $tenantId, $productId, $batchNo, CURRENT_DATE, $expDate,
        ${req.mrp}, ${req.costPrice}, ${req.sellingPrice}, ${req.initialQuantity}
      )
    """.update.run

    (insertProduct *> insertBatch).transact(xa).map { _ =>
      Product(
        id = productId,
        tenantId = tenantId,
        categoryId = req.categoryId,
        name = req.name,
        barcode = req.barcode,
        sku = req.sku,
        unit = req.unit,
        hsnCode = hsn,
        gstRate = req.gstRate,
        isPriceTaxInclusive = req.isPriceTaxInclusive,
        minStockAlert = req.minStockAlert,
        isActive = true,
        currentStock = req.initialQuantity,
        mrp = req.mrp,
        sellingPrice = req.sellingPrice
      )
    }

  def getProductBatches(tenantId: UUID, productId: UUID): IO[List[ProductBatch]] =
    sql"""
      SELECT id, tenant_id, product_id, batch_no, mfg_date, expiry_date,
             mrp, cost_price, selling_price, quantity
      FROM product_batches
      WHERE tenant_id = $tenantId AND product_id = $productId AND quantity > 0
      ORDER BY expiry_date ASC NULLS LAST, created_at ASC
    """.query[ProductBatch].to[List].transact(xa)

  def getLowStockProducts(tenantId: UUID): IO[List[Product]] =
    sql"""
      SELECT p.id, p.tenant_id, p.category_id, p.name, p.barcode, p.sku, p.unit,
             p.hsn_code, p.gst_rate, p.is_price_tax_inclusive, p.min_stock_alert, p.is_active,
             COALESCE(SUM(b.quantity), 0) as current_stock,
             COALESCE(MAX(b.mrp), 0) as mrp,
             COALESCE(MAX(b.selling_price), 0) as selling_price
      FROM products p
      LEFT JOIN product_batches b ON p.id = b.product_id
      WHERE p.tenant_id = $tenantId AND p.is_active = true
      GROUP BY p.id
      HAVING COALESCE(SUM(b.quantity), 0) <= p.min_stock_alert
      ORDER BY current_stock ASC
    """.query[Product].to[List].transact(xa)

