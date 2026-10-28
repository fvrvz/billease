package com.billease.service

import cats.effect.IO
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import com.billease.config.NotificationsConfig
import com.billease.domain.*
import java.util.UUID
import java.time.Instant
import org.http4s.client.Client
import org.http4s.{Request, Method, Uri, Headers, Header}
import org.typelevel.ci.CIString
import io.circe.syntax.*
import io.circe.Json

class NotificationService(
    xa: Transactor[IO],
    httpClient: Client[IO],
    config: NotificationsConfig
):

  def sendLowStockAlert(
      tenantId: UUID,
      productId: UUID,
      productName: String,
      currentStock: BigDecimal,
      minStock: Int,
      recipientPhone: String,
      recipientEmail: Option[String]
  ): IO[Unit] =
    val message = s"⚠️ [Billease Alert] Low Stock: $productName has only $currentStock left (Min: $minStock). Reorder soon!"

    if config.whatsapp.enabled && config.whatsapp.accessToken.nonEmpty then
      sendWhatsapp(recipientPhone, message).flatMap {
        case Right(_) =>
          logAlert(tenantId, Some(productId), AlertType.LOW_STOCK, message, AlertChannel.WHATSAPP, recipientPhone, "SENT", None)
        case Left(err) =>
          // Fallback to email
          recipientEmail match
            case Some(email) if config.email.enabled =>
              sendEmail(email, s"Low Stock Alert: $productName", message).flatMap { _ =>
                logAlert(tenantId, Some(productId), AlertType.LOW_STOCK, message, AlertChannel.EMAIL, email, "SENT", Some(s"WhatsApp failed: $err. Sent via Email fallback."))
              }
            case _ =>
              logAlert(tenantId, Some(productId), AlertType.LOW_STOCK, message, AlertChannel.WHATSAPP, recipientPhone, "FAILED", Some(err))
      }
    else if config.email.enabled && recipientEmail.isDefined then
      val email = recipientEmail.get
      sendEmail(email, s"Low Stock Alert: $productName", message).flatMap { _ =>
        logAlert(tenantId, Some(productId), AlertType.LOW_STOCK, message, AlertChannel.EMAIL, email, "SENT", None)
      }
    else
      // Simulated delivery in dev mode
      IO.println(s"[Notification Mock] Stock Alert for '$productName' -> Phone: $recipientPhone, Email: $recipientEmail") *>
      logAlert(tenantId, Some(productId), AlertType.LOW_STOCK, message, AlertChannel.WHATSAPP, recipientPhone, "SENT", Some("Simulated / Local Mode"))

  private def sendWhatsapp(toPhone: String, text: String): IO[Either[String, Unit]] =
    val urlStr = s"${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages"
    Uri.fromString(urlStr) match
      case Left(err) => IO.pure(Left(s"Invalid WhatsApp API URL: $err"))
      case Right(uri) =>
        val payload = Json.obj(
          "messaging_product" -> "whatsapp".asJson,
          "to" -> toPhone.replaceAll("[^0-9]", "").asJson,
          "type" -> "text".asJson,
          "text" -> Json.obj("body" -> text.asJson)
        )
        val req = Request[IO](
          method = Method.POST,
          uri = uri,
          headers = Headers(
            Header.Raw(CIString("Authorization"), s"Bearer ${config.whatsapp.accessToken}"),
            Header.Raw(CIString("Content-Type"), "application/json")
          )
        ).withEntity(payload.noSpaces)

        httpClient.status(req).map { status =>
          if status.isSuccess then Right(())
          else Left(s"WhatsApp API returned status ${status.code}")
        }.handleError(e => Left(e.getMessage))

  private def sendEmail(toEmail: String, subject: String, body: String): IO[Unit] =
    IO.println(s"[Email Service] Sending email to $toEmail: Subject: $subject, Body: $body")

  private def logAlert(
      tenantId: UUID,
      productId: Option[UUID],
      alertType: AlertType,
      message: String,
      channel: AlertChannel,
      recipient: String,
      status: String,
      errorMessage: Option[String]
  ): IO[Unit] =
    val id = UUID.randomUUID()
    val alertTypeStr = alertType.toString
    val channelStr = channel.toString
    sql"""
      INSERT INTO stock_alerts_log (
        id, tenant_id, product_id, alert_type, message, channel, recipient, status, error_message
      ) VALUES (
        $id, $tenantId, $productId, $alertTypeStr, $message, $channelStr, $recipient, $status, $errorMessage
      )
    """.update.run.transact(xa).void
