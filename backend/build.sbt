ThisBuild / scalaVersion := "3.5.2"
ThisBuild / version := "1.0.0"
ThisBuild / organization := "com.billease"

val tapirVersion      = "1.11.10"
val http4sVersion     = "0.23.30"
val circeVersion      = "0.14.10"
val catsEffectVersion = "3.5.7"
val doobieVersion     = "1.0.0-RC6"
val pureConfigVersion = "0.17.8"

lazy val root = (project in file("."))
  .settings(
    name := "billease-backend",
    scalacOptions ++= Seq(
      "-deprecation",
      "-feature",
      "-unchecked",
      "-Xfatal-warnings"
    ),
    libraryDependencies ++= Seq(
      // Cats Effect
      "org.typelevel" %% "cats-effect" % catsEffectVersion,

      // Tapir
      "com.softwaremill.sttp.tapir" %% "tapir-core"              % tapirVersion,
      "com.softwaremill.sttp.tapir" %% "tapir-http4s-server"     % tapirVersion,
      "com.softwaremill.sttp.tapir" %% "tapir-json-circe"        % tapirVersion,
      "com.softwaremill.sttp.tapir" %% "tapir-swagger-ui-bundle" % tapirVersion,

      // Http4s
      "org.http4s" %% "http4s-ember-server" % http4sVersion,
      "org.http4s" %% "http4s-ember-client" % http4sVersion,
      "org.http4s" %% "http4s-circe"        % http4sVersion,
      "org.http4s" %% "http4s-dsl"          % http4sVersion,

      // Circe
      "io.circe" %% "circe-core"    % circeVersion,
      "io.circe" %% "circe-generic" % circeVersion,
      "io.circe" %% "circe-parser"  % circeVersion,

      // Database (Doobie + PostgreSQL + Flyway)
      "org.tpolecat" %% "doobie-core"     % doobieVersion,
      "org.tpolecat" %% "doobie-hikari"   % doobieVersion,
      "org.tpolecat" %% "doobie-postgres" % doobieVersion,
      "org.postgresql" % "postgresql"     % "42.7.4",
      "org.flywaydb"   % "flyway-core"    % "10.21.0",
      "org.flywaydb"   % "flyway-database-postgresql" % "10.21.0",

      // Configuration
      "com.github.pureconfig" %% "pureconfig-core" % pureConfigVersion,

      // OIDC JWT validation
      "com.nimbusds" % "nimbus-jose-jwt" % "9.47",

      // Logging
      "ch.qos.logback" % "logback-classic" % "1.5.16"
    )
  )

