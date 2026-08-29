# STAGE 1: Build & Package Artifact
FROM eclipse-temurin:17-jdk-jammy AS builder

WORKDIR /build

# Copy Maven wrapper and POM first for Docker layer caching
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN ./mvnw clean package -DskipTests

# STAGE 2: Lightweight Production Runtime
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Create dedicated non-root application user for container security
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

# Copy compiled JAR from builder stage
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

# Production JVM tuning flags
ENTRYPOINT ["java", \
  "-XX:+UseG1GC", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", \
  "app.jar"]