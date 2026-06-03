package no.nav.fagprove.config

import io.ktor.events.*
import io.ktor.server.application.*
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database
import org.testcontainers.containers.PostgreSQLContainer

/**
 * Responsible for database connection setup and schema migration.
 * Runs Flyway migrations for PostgreSQL configs (Testcontainers and External).
 * H2 InMemory skips Flyway — repositories use SchemaUtils.create() instead.
 */
object DatabaseFactory {
    fun init(
        application: Application,
        config: AppConfig,
    ): Database =
        when (config) {
            is AppConfig.Testcontainers -> initTestcontainers(application)
            is AppConfig.External -> initExternal(config.database)
            is AppConfig.InMemory -> connect(config.database)
        }

    private fun initTestcontainers(application: Application): Database {
        application.log.info("Starting PostgreSQL via Testcontainers...")
        val container = PostgreSQLContainer<Nothing>("postgres:17-alpine").also { it.start() }
        application.log.info("Testcontainers PostgreSQL ready at ${container.jdbcUrl}")

        application.monitor.subscribe(ApplicationStopped) { container.stop() }

        runMigrations(container.jdbcUrl, container.username, container.password)

        return Database.connect(
            url = container.jdbcUrl,
            driver = "org.postgresql.Driver",
            user = container.username,
            password = container.password,
        )
    }

    private fun initExternal(dbConfig: AppConfig.DatabaseConfig): Database {
        runMigrations(dbConfig.url, dbConfig.user, dbConfig.password)
        return connect(dbConfig)
    }

    private fun connect(dbConfig: AppConfig.DatabaseConfig): Database =
        Database.connect(
            url = dbConfig.url,
            driver = dbConfig.driver,
            user = dbConfig.user,
            password = dbConfig.password,
        )

    private fun runMigrations(
        url: String,
        user: String,
        password: String,
    ) {
        Flyway
            .configure()
            .dataSource(url, user, password)
            .locations("classpath:db/migration")
            .load()
            .migrate()
    }
}
