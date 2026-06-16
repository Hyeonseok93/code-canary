# Stage 1: Build Spring Boot jar inside Docker
FROM eclipse-temurin:21-jdk@sha256:b9142586f9712700c6c9e07adcedfb18608b1a3a056e4001423a3354adfa9d80 AS build
WORKDIR /app

COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
RUN chmod +x gradlew

COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2: Run with JRE only (non-root)
FROM eclipse-temurin:21-jre-alpine@sha256:704db3c40204a44f471191446ddd9cda5d60dab40f0e15c6507b815ed897238b
WORKDIR /app

RUN apk add --no-cache curl \
    && addgroup -g 10001 appgroup \
    && adduser -u 10001 -G appgroup -D appuser

COPY --from=build /app/build/libs/app.jar app.jar
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh \
    && chmod +x /docker-entrypoint.sh \
    && chown -R appuser:appgroup /app /docker-entrypoint.sh

USER 10001:10001

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
