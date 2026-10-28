# ==========================================
# Stage 1: Builder (Scala 3 + sbt)
# ==========================================
FROM eclipse-temurin:21-jdk-jammy AS builder

# Install sbt binary distribution directly
ENV SBT_VERSION=1.10.7
RUN apt-get update && apt-get install -y --no-install-recommends curl tar bash \
    && curl -fsSL "https://github.com/sbt/sbt/releases/download/v${SBT_VERSION}/sbt-${SBT_VERSION}.tgz" | tar -xz -C /usr/local \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/usr/local/sbt/bin:${PATH}"

WORKDIR /build

# Cache sbt build definition & plugins layer
COPY project/build.properties project/plugins.sbt ./project/
COPY build.sbt .
RUN sbt update

# Copy source code and build production stage
COPY src/ ./src/
RUN sbt stage

# ==========================================
# Stage 2: Minimal Production Runtime Image
# ==========================================
FROM eclipse-temurin:21-jre-jammy AS runner

# Create non-root system user
RUN groupadd -r billease && useradd -r -g billease -m -d /home/billease billease

WORKDIR /app

# Copy only the staged binary and runtime libraries from builder
COPY --from=builder --chown=billease:billease /build/target/universal/stage /app

RUN chmod +x /app/bin/billease-backend

USER billease

EXPOSE 8080

ENTRYPOINT ["/app/bin/billease-backend"]
