FROM openjdk:21-jdk-slim

VOLUME /tmp

COPY target/eureka-server-*.jar /app/eureka-server.jar

ENTRYPOINT ["java", "-jar", "/app/eureka-server.jar"]
