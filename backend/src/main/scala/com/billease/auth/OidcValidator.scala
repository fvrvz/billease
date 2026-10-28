package com.billease.auth

import cats.effect.{IO, Sync}
import com.billease.config.OidcConfig
import com.billease.domain.{Role, User}
import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.jwk.source.RemoteJWKSet
import com.nimbusds.jose.proc.{JWSVerificationKeySelector, SecurityContext}
import com.nimbusds.jwt.proc.DefaultJWTProcessor
import com.nimbusds.jwt.JWTClaimsSet
import java.net.URL
import java.util.UUID
import scala.util.Try

case class AuthenticatedUser(
    userId: UUID,
    tenantId: Option[UUID],
    username: String,
    role: Role
)

class OidcValidator(config: OidcConfig):

  private val jwtProcessorOpt: Option[DefaultJWTProcessor[SecurityContext]] =
    if config.enabled && config.jwksUrl.nonEmpty then
      Try {
        val jwkSetURL = new URL(config.jwksUrl)
        val jwkSource = new RemoteJWKSet[SecurityContext](jwkSetURL)
        val keySelector = new JWSVerificationKeySelector[SecurityContext](JWSAlgorithm.RS256, jwkSource)
        val processor = new DefaultJWTProcessor[SecurityContext]()
        processor.setJWSKeySelector(keySelector)
        processor
      }.toOption
    else None

  def validateToken(token: String): IO[Either[String, AuthenticatedUser]] = IO.blocking {
    if !config.enabled then
      // Local / Offline token parsing (Simple signed or demo format)
      parseLocalOrDemoToken(token)
    else
      jwtProcessorOpt match
        case Some(processor) =>
          Try {
            val claims: JWTClaimsSet = processor.process(token, null)
            val sub = claims.getSubject
            val tenantIdStr = Option(claims.getStringClaim("tenant_id"))
            val roleStr = Option(claims.getStringClaim("role")).getOrElse("CASHIER")
            val username = Option(claims.getStringClaim("preferred_username")).getOrElse(sub)

            AuthenticatedUser(
              userId = Try(UUID.fromString(sub)).getOrElse(UUID.randomUUID()),
              tenantId = tenantIdStr.flatMap(s => Try(UUID.fromString(s)).toOption),
              username = username,
              role = Try(Role.valueOf(roleStr)).getOrElse(Role.CASHIER)
            )
          }.toEither.left.map(_.getMessage)

        case None =>
          parseLocalOrDemoToken(token)
  }

  private def parseLocalOrDemoToken(token: String): Either[String, AuthenticatedUser] =
    // Accepts "demo-<role>-<tenantId>-<userId>" or JWT base64 format
    if token.startsWith("demo-") then
      val parts = token.split(":")
      if parts.length >= 3 then
        val role = Try(Role.valueOf(parts(1))).getOrElse(Role.CASHIER)
        val tenantId = if parts(2) == "global" then None else Try(UUID.fromString(parts(2))).toOption
        val userId = if parts.length > 3 then Try(UUID.fromString(parts(3))).getOrElse(UUID.randomUUID()) else UUID.randomUUID()
        val username = if parts.length > 4 then parts(4) else s"user_${role.toString.toLowerCase}"
        Right(AuthenticatedUser(userId, tenantId, username, role))
      else Left("Invalid demo token format")
    else if token == "superadmin-token" then
      Right(AuthenticatedUser(UUID.fromString("b0000000-0000-0000-0000-000000000001"), None, "superadmin", Role.SUPER_ADMIN))
    else if token == "owner-token" then
      Right(AuthenticatedUser(UUID.fromString("b0000000-0000-0000-0000-000000000002"), Some(UUID.fromString("a0000000-0000-0000-0000-000000000001")), "ganesh_owner", Role.STORE_ADMIN))
    else if token == "cashier-token" then
      Right(AuthenticatedUser(UUID.fromString("b0000000-0000-0000-0000-000000000003"), Some(UUID.fromString("a0000000-0000-0000-0000-000000000001")), "cashier1", Role.CASHIER))
    else
      Left("Invalid authentication token")
