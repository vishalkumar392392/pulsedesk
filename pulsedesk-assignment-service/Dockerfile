# Use Amazon Corretto 21 on Alpine Linux
FROM amazoncorretto:21-alpine

WORKDIR /app

COPY target/pulsedesk-assignment-service-0.0.1-SNAPSHOT.jar app.jar

ENTRYPOINT ["java", "-jar", "/app/app.jar"]