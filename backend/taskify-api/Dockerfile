FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /build

COPY pom.xml ./
COPY src ./src
RUN mvn --batch-mode --no-transfer-progress package

FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app

COPY --from=build --chown=10001:10001 /build/target/taskify-api-*.jar ./app.jar
USER 10001:10001

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
