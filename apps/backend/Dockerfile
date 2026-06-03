# Thin runtime image — the fat jar is built by CI (./gradlew buildFatJar)
# before this Dockerfile runs. This keeps the image minimal (no JDK/Gradle).
FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/jre:openjdk-21

WORKDIR /app

COPY build/libs/fagprove-monorepo-template-all.jar app.jar

EXPOSE 8080

# -Duser.dir=/tmp: swagger-codegen writes docs on startup; /tmp is writable in read-only containers
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-Duser.dir=/tmp", "-jar", "/app/app.jar"]
