package com.billease

import cats.effect.{IO, IOApp, ExitCode}
import com.billease.config.AppConfig
import com.billease.auth.OidcValidator
import com.billease.service.*
import com.billease.api.Routes
import doobie.hikari.HikariTransactor
import org.flywaydb.core.Flyway
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.ember.client.EmberClientBuilder
import org.http4s.server.middleware.CORS
import com.comcast.ip4s.{Host, Port}

object Main extends IOApp:

  override def run(args: List[String]): IO[ExitCode] =
    for
      _ <- IO.println("🚀 Starting Billease Backend Engine (Scala 3)...")
      config = AppConfig.load()
      _ <- IO.println(s"Loaded configuration for server: ${config.server.host}:${config.server.port}")

      // 1. Run Flyway DB Migrations
      _ <- IO.blocking {
        val flyway = Flyway.configure()
          .dataSource(config.database.url, config.database.user, config.database.password)
          .locations("classpath:db/migration")
          .baselineOnMigrate(true)
          .load()
        flyway.migrate()
      }.attempt.flatMap {
        case Right(res) => IO.println(s"✅ Flyway migration completed: ${res.migrationsExecuted} executed.")
        case Left(err) => IO.println(s"⚠️ Flyway migration warning: ${err.getMessage}")
      }

      // 2. Resource management: Transactor & HTTP Client
      exitCode <- (for
        xa <- HikariTransactor.newHikariTransactor[IO](
          config.database.driver,
          config.database.url,
          config.database.user,
          config.database.password,
          scala.concurrent.ExecutionContext.global
        )
        httpClient <- EmberClientBuilder.default[IO].build
      yield (xa, httpClient)).use { case (xa, httpClient) =>
        // 3. Initialize Services
        val oidcValidator = new OidcValidator(config.oidc)
        val tenantService = new TenantService(xa)
        val productService = new ProductService(xa)
        val couponService = new LoyaltyCouponService(xa)
        val khataService = new KhataService(xa)
        val notificationService = new NotificationService(xa, httpClient, config.notifications)
        val billingService = new BillingService(xa, tenantService, couponService, khataService, notificationService)

        val apiRoutes = new Routes(
          oidcValidator,
          tenantService,
          productService,
          billingService,
          khataService,
          couponService
        )

        val corsRoutes = CORS.policy.withAllowOriginAll.withAllowCredentials(false)(apiRoutes.httpRoutes).orNotFound

        val host = Host.fromString(config.server.host).getOrElse(Host.fromString("0.0.0.0").get)
        val port = Port.fromInt(config.server.port).getOrElse(Port.fromInt(8080).get)

        IO.println(s"🌐 Billease REST API & Swagger UI listening at http://${config.server.host}:${config.server.port}/docs") *>
        EmberServerBuilder
          .default[IO]
          .withHost(host)
          .withPort(port)
          .withHttpApp(corsRoutes)
          .build
          .useForever
          .as(ExitCode.Success)
      }
    yield exitCode
