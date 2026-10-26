# Backend image: builds the Spring Boot jar, then runs it on a slim JRE.
# Build:  docker build -t typequest-api .

FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Dependencies first, so editing code does not re-download them.
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src src
RUN ./mvnw -B -q -DskipTests package && cp target/*.jar app.jar

FROM eclipse-temurin:25-jre
WORKDIR /app

# curl is only for the container health check.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 typequest

COPY --from=build /app/app.jar app.jar

USER typequest
EXPOSE 8080

# Tuned for small hosts (512 MB, as on free plans): one GC thread, small stacks,
# and room left over for the JVM itself. Override JAVA_TOOL_OPTIONS on a bigger host.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS http://localhost:${PORT:-8080}/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
