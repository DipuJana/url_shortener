
# STAGE 1: Build React frontend
FROM node:24-alpine AS frontend-builder

WORKDIR /frontend

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Build production frontend
COPY frontend/ ./
RUN npm run build


# STAGE 2: Build Spring Boot application
FROM eclipse-temurin:17-jdk-jammy AS builder

WORKDIR /build

# Maven dependency caching
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

# Copy backend source
COPY src ./src

# Package React build into Spring Boot static resources
COPY --from=frontend-builder /frontend/dist/ ./src/main/resources/static/

# Build executable JAR
RUN ./mvnw clean package -DskipTests


# STAGE 3: Production runtime
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Dedicated non-root user
RUN groupadd -r spring && useradd -r -g spring spring

# Copy executable JAR
COPY --chown=spring:spring --from=builder /build/target/*.jar app.jar

USER spring:spring

EXPOSE 8080

# Production JVM settings
ENTRYPOINT ["java", \
    "-XX:+UseG1GC", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", \
    "app.jar"]
