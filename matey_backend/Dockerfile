FROM maven:3.9-eclipse-temurin-21

WORKDIR /app

COPY pom.xml .
COPY src ./src

EXPOSE 8080

CMD ["mvn", "clean", "install"]
CMD ["mvn", "spring-boot:run"] 