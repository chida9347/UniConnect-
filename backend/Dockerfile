# ---- Build stage ------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Runtime stage ----------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app \
    && mkdir -p /app/uploads && chown -R app:app /app

COPY --from=build /app/target/uniconnect-api-1.0.0.jar /app/app.jar

USER app
EXPOSE 8080
ENV PORT=8080

# C1-only JIT and the serial GC keep startup usable on Render's 0.1 CPU / 512 MB plan.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:TieredStopAtLevel=1", "-XX:+UseSerialGC", "-Djava.awt.headless=true", "-jar", "/app/app.jar"]
