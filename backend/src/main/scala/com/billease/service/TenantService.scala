package com.billease.service

import cats.effect.IO
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import com.billease.domain.*
import java.util.UUID

class TenantService(xa: Transactor[IO]):

  def listAllTenants(): IO[List[Tenant]] =
    sql"""
      SELECT id, slug, name, legal_name, phone, email, address, city, state_code,
             has_gst, gstin, is_composition_scheme, logo_url, banner_url,
             invoice_prefix, invoice_footer, thermal_width_mm, upi_vpa, upi_payee_name,
             loyalty_points_per_100, loyalty_point_value_rs, is_active
      FROM tenants
      ORDER BY name ASC
    """.query[Tenant].to[List].transact(xa)

  def getTenantById(id: UUID): IO[Option[Tenant]] =
    sql"""
      SELECT id, slug, name, legal_name, phone, email, address, city, state_code,
             has_gst, gstin, is_composition_scheme, logo_url, banner_url,
             invoice_prefix, invoice_footer, thermal_width_mm, upi_vpa, upi_payee_name,
             loyalty_points_per_100, loyalty_point_value_rs, is_active
      FROM tenants
      WHERE id = $id
    """.query[Tenant].option.transact(xa)

  def updateTenant(id: UUID, req: TenantUpdate): IO[Option[Tenant]] =
    for
      existingOpt <- getTenantById(id)
      result <- existingOpt match
        case Some(t) =>
          val updated = t.copy(
            name = req.name.getOrElse(t.name),
            legalName = req.legalName.orElse(t.legalName),
            phone = req.phone.getOrElse(t.phone),
            email = req.email.orElse(t.email),
            address = req.address.orElse(t.address),
            city = req.city.orElse(t.city),
            stateCode = req.stateCode.getOrElse(t.stateCode),
            hasGst = req.hasGst.getOrElse(t.hasGst),
            gstin = req.gstin.orElse(t.gstin),
            isCompositionScheme = req.isCompositionScheme.getOrElse(t.isCompositionScheme),
            logoUrl = req.logoUrl.orElse(t.logoUrl),
            bannerUrl = req.bannerUrl.orElse(t.bannerUrl),
            invoicePrefix = req.invoicePrefix.getOrElse(t.invoicePrefix),
            invoiceFooter = req.invoiceFooter.getOrElse(t.invoiceFooter),
            thermalWidthMm = req.thermalWidthMm.getOrElse(t.thermalWidthMm),
            upiVpa = req.upiVpa.orElse(t.upiVpa),
            upiPayeeName = req.upiPayeeName.orElse(t.upiPayeeName),
            loyaltyPointsPer100 = req.loyaltyPointsPer100.getOrElse(t.loyaltyPointsPer100),
            loyaltyPointValueRs = req.loyaltyPointValueRs.getOrElse(t.loyaltyPointValueRs),
            isActive = req.isActive.getOrElse(t.isActive)
          )
          sql"""
            UPDATE tenants SET
              name = ${updated.name},
              legal_name = ${updated.legalName},
              phone = ${updated.phone},
              email = ${updated.email},
              address = ${updated.address},
              city = ${updated.city},
              state_code = ${updated.stateCode},
              has_gst = ${updated.hasGst},
              gstin = ${updated.gstin},
              is_composition_scheme = ${updated.isCompositionScheme},
              logo_url = ${updated.logoUrl},
              banner_url = ${updated.bannerUrl},
              invoice_prefix = ${updated.invoicePrefix},
              invoice_footer = ${updated.invoiceFooter},
              thermal_width_mm = ${updated.thermalWidthMm},
              upi_vpa = ${updated.upiVpa},
              upi_payee_name = ${updated.upiPayeeName},
              loyalty_points_per_100 = ${updated.loyaltyPointsPer100},
              loyalty_point_value_rs = ${updated.loyaltyPointValueRs},
              is_active = ${updated.isActive},
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $id
          """.update.run.transact(xa).map(_ => Some(updated))
        case None => IO.pure(None)
    yield result

  def createTenant(req: TenantCreate): IO[Tenant] =
    val id = UUID.randomUUID()
    val tenant = Tenant(
      id = id,
      slug = req.slug,
      name = req.name,
      legalName = req.legalName,
      phone = req.phone,
      email = req.email,
      address = req.address,
      city = req.city,
      stateCode = req.stateCode,
      hasGst = req.hasGst,
      gstin = req.gstin,
      isCompositionScheme = req.isCompositionScheme,
      logoUrl = req.logoUrl,
      bannerUrl = req.bannerUrl,
      invoicePrefix = req.invoicePrefix,
      invoiceFooter = req.invoiceFooter,
      thermalWidthMm = req.thermalWidthMm,
      upiVpa = req.upiVpa,
      upiPayeeName = req.upiPayeeName,
      loyaltyPointsPer100 = req.loyaltyPointsPer100,
      loyaltyPointValueRs = req.loyaltyPointValueRs,
      isActive = true
    )
    sql"""
      INSERT INTO tenants (
        id, slug, name, legal_name, phone, email, address, city, state_code,
        has_gst, gstin, is_composition_scheme, logo_url, banner_url,
        invoice_prefix, invoice_footer, thermal_width_mm, upi_vpa, upi_payee_name,
        loyalty_points_per_100, loyalty_point_value_rs, is_active
      ) VALUES (
        ${tenant.id}, ${tenant.slug}, ${tenant.name}, ${tenant.legalName}, ${tenant.phone}, ${tenant.email},
        ${tenant.address}, ${tenant.city}, ${tenant.stateCode}, ${tenant.hasGst}, ${tenant.gstin},
        ${tenant.isCompositionScheme}, ${tenant.logoUrl}, ${tenant.bannerUrl}, ${tenant.invoicePrefix},
        ${tenant.invoiceFooter}, ${tenant.thermalWidthMm}, ${tenant.upiVpa}, ${tenant.upiPayeeName},
        ${tenant.loyaltyPointsPer100}, ${tenant.loyaltyPointValueRs}, true
      )
    """.update.run.transact(xa).map(_ => tenant)

  def toggleTenantActive(id: UUID): IO[Option[Tenant]] =
    sql"""
      UPDATE tenants SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = $id
    """.update.run.transact(xa).flatMap { rows =>
      if rows > 0 then getTenantById(id)
      else IO.pure(None)
    }

  def deleteTenant(id: UUID): IO[Boolean] =
    sql"""
      DELETE FROM tenants WHERE id = $id
    """.update.run.transact(xa).map(_ > 0)

  def listTenantUsers(tenantId: UUID): IO[List[User]] =
    sql"""
      SELECT id, tenant_id, username, full_name, email, phone, role, is_active
      FROM users
      WHERE tenant_id = $tenantId
      ORDER BY full_name ASC
    """.query[User].to[List].transact(xa)

  def createUser(req: UserCreate): IO[User] =
    val id = UUID.randomUUID()
    val roleStr = req.role.toString
    sql"""
      INSERT INTO users (id, tenant_id, username, password_hash, full_name, email, phone, role, is_active)
      VALUES ($id, ${req.tenantId}, ${req.username}, ${req.password}, ${req.fullName}, ${req.email}, ${req.phone}, $roleStr, true)
    """.update.run.transact(xa).map { _ =>
      User(id, req.tenantId, req.username, req.fullName, req.email, req.phone, req.role, true)
    }

  def toggleUserActive(tenantId: UUID, userId: UUID): IO[Option[User]] =
    sql"""
      UPDATE users SET is_active = NOT is_active
      WHERE id = $userId AND tenant_id = $tenantId
    """.update.run.transact(xa).flatMap { rows =>
      if rows > 0 then
        sql"""SELECT id, tenant_id, username, full_name, email, phone, role, is_active
              FROM users WHERE id = $userId""".query[User].option.transact(xa)
      else IO.pure(None)
    }

  def authenticateUser(username: String, pass: String): IO[Option[(User, Option[Tenant])]] =
    for
      userOpt <- sql"""
        SELECT id, tenant_id, username, full_name, email, phone, role, is_active
        FROM users
        WHERE username = $username AND password_hash = $pass AND is_active = true
      """.query[User].option.transact(xa)
      tenantOpt <- userOpt match
        case Some(u) =>
          u.tenantId match
            case Some(tId) => getTenantById(tId)
            case None => IO.pure(None)
        case None => IO.pure(None)
    yield userOpt.map(u => (u, tenantOpt))

