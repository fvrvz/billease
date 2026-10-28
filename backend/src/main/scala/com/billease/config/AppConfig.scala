package com.billease.config

import pureconfig.*
import pureconfig.generic.derivation.default.*

case class ServerConfig(host: String, port: Int) derives ConfigReader
case class DatabaseConfig(driver: String, url: String, user: String, password: String, poolSize: Int) derives ConfigReader
case class OidcConfig(enabled: Boolean, issuerUrl: String, clientId: String, audience: String, jwksUrl: String) derives ConfigReader
case class WhatsappConfig(enabled: Boolean, apiUrl: String, phoneNumberId: String, accessToken: String) derives ConfigReader
case class EmailConfig(enabled: Boolean, smtpHost: String, smtpPort: Int, smtpUser: String, smtpPass: String, fromEmail: String) derives ConfigReader
case class NotificationsConfig(whatsapp: WhatsappConfig, email: EmailConfig) derives ConfigReader

case class AppConfig(
    server: ServerConfig,
    database: DatabaseConfig,
    oidc: OidcConfig,
    notifications: NotificationsConfig
) derives ConfigReader

object AppConfig:
  def load(): AppConfig =
    ConfigSource.default.loadOrThrow[AppConfig]

