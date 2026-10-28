FROM sbtscala/scala-sbt:eclipse-temurin-jammy-21.0.2_13_1.10.7_3.5.2 AS builder

WORKDIR /app
COPY build.sbt .
COPY project/ ./project/
# Pre-fetch dependencies
RUN sbt update

COPY src/ ./src/
RUN sbt stage || sbt compile

# Runtime stage
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app
COPY --from=builder /app /app

EXPOSE 8080
CMD ["sbt", "run"]
