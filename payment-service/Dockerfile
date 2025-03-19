FROM openjdk:21-jdk-slim

WORKDIR /app

COPY target/payment-service-*.jar app.jar

EXPOSE 8086

ENTRYPOINT ["java", "-jar", "app.jar"]
