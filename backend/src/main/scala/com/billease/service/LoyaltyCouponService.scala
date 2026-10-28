package com.billease.service

import cats.effect.IO
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import com.billease.domain.*
import java.util.UUID
import java.time.Instant
import scala.math.BigDecimal.RoundingMode as RM

class LoyaltyCouponService(xa: Transactor[IO]):

  def listCoupons(tenantId: UUID): IO[List[Coupon]] =
    sql"""
      SELECT id, tenant_id, code, discount_type, discount_value, min_order_amount,
             max_discount_cap, valid_until, usage_count, max_usage, is_active
      FROM coupons
      WHERE tenant_id = $tenantId AND is_active = true
      ORDER BY created_at DESC
    """.query[Coupon].to[List].transact(xa)

  def createCoupon(tenantId: UUID, req: CouponCreate): IO[Coupon] =
    val id = UUID.randomUUID()
    val discTypeStr = req.discountType.toString
    sql"""
      INSERT INTO coupons (
        id, tenant_id, code, discount_type, discount_value, min_order_amount,
        max_discount_cap, valid_until, usage_count, max_usage, is_active
      ) VALUES (
        $id, $tenantId, ${req.code.toUpperCase}, $discTypeStr, ${req.discountValue},
        ${req.minOrderAmount}, ${req.maxDiscountCap}, ${req.validUntil}, 0, ${req.maxUsage}, true
      )
    """.update.run.transact(xa).map { _ =>
      Coupon(
        id = id,
        tenantId = tenantId,
        code = req.code.toUpperCase,
        discountType = req.discountType,
        discountValue = req.discountValue,
        minOrderAmount = req.minOrderAmount,
        maxDiscountCap = req.maxDiscountCap,
        validUntil = req.validUntil,
        usageCount = 0,
        maxUsage = req.maxUsage,
        isActive = true
      )
    }

  def validateCoupon(tenantId: UUID, code: String, cartTotal: BigDecimal): IO[CouponValidationResult] =
    sql"""
      SELECT id, tenant_id, code, discount_type, discount_value, min_order_amount,
             max_discount_cap, valid_until, usage_count, max_usage, is_active
      FROM coupons
      WHERE tenant_id = $tenantId AND code = ${code.toUpperCase} AND is_active = true
    """.query[Coupon].option.transact(xa).map {
      case None =>
        CouponValidationResult(false, BigDecimal(0), s"Coupon code '$code' not found or inactive")
      case Some(coupon) =>
        if coupon.usageCount >= coupon.maxUsage then
          CouponValidationResult(false, BigDecimal(0), "Coupon usage limit reached")
        else if coupon.validUntil.exists(_.isBefore(Instant.now())) then
          CouponValidationResult(false, BigDecimal(0), "Coupon has expired")
        else if cartTotal < coupon.minOrderAmount then
          CouponValidationResult(false, BigDecimal(0), s"Minimum order amount of ₹${coupon.minOrderAmount} required")
        else
          val rawDiscount = coupon.discountType match
            case DiscountType.FLAT =>
              coupon.discountValue.min(cartTotal)
            case DiscountType.PERCENTAGE =>
              val calculated = (cartTotal * coupon.discountValue) / BigDecimal(100)
              coupon.maxDiscountCap.fold(calculated)(cap => calculated.min(cap))

          val finalDiscount = rawDiscount.setScale(2, RM.HALF_UP)
          CouponValidationResult(true, finalDiscount, s"Coupon '$code' applied successfully! Saved ₹$finalDiscount")
    }

  def incrementCouponUsage(tenantId: UUID, code: String): IO[Unit] =
    sql"""
      UPDATE coupons SET usage_count = usage_count + 1
      WHERE tenant_id = $tenantId AND code = ${code.toUpperCase}
    """.update.run.transact(xa).void

