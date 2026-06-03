package no.nav.fagprove.config

import java.net.URI

/**
 * Sealed class for environment-based database configuration.
 * Eliminates scattered System.getenv() calls throughout the codebase.
 */
sealed class AppConfig {
    abstract val database: DatabaseConfig

    data class DatabaseConfig(
        val url: String,
        val user: String,
        val password: String,
        val driver: String,
    )

    data class Testcontainers(
        override val database: DatabaseConfig,
    ) : AppConfig()

    data class External(
        override val database: DatabaseConfig,
    ) : AppConfig()

    data class InMemory(
        override val database: DatabaseConfig,
    ) : AppConfig()

    companion object {
        private const val POSTGRES_DRIVER = "org.postgresql.Driver"

        fun resolve(env: Map<String, String> = System.getenv()): AppConfig {
            val useTestcontainers = env["USE_TESTCONTAINERS"] == "true"
            val postgresUrl = env.value("POSTGRES_URL")
            val naisDatabase = resolveNaisDatabase(env)

            return when {
                useTestcontainers ->
                    // URL/user/password set dynamically after container starts
                    Testcontainers(
                        DatabaseConfig(
                            url = "",
                            user = "",
                            password = "",
                            driver = POSTGRES_DRIVER,
                        ),
                    )
                naisDatabase != null ->
                    External(naisDatabase)
                postgresUrl != null ->
                    External(
                        DatabaseConfig(
                            url = postgresUrl,
                            user = env.value("POSTGRES_USER") ?: "postgres",
                            password = env["POSTGRES_PASSWORD"] ?: "",
                            driver = POSTGRES_DRIVER,
                        ),
                    )
                else ->
                    InMemory(
                        DatabaseConfig(
                            url = "jdbc:h2:mem:test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
                            user = "root",
                            password = "",
                            driver = "org.h2.Driver",
                        ),
                    )
            }
        }

        private fun resolveNaisDatabase(env: Map<String, String>): DatabaseConfig? {
            env.value("DB_JDBC_URL")?.let { jdbcUrl ->
                return DatabaseConfig(
                    url = jdbcUrl,
                    user = env.value("DB_USERNAME") ?: "postgres",
                    password = env["DB_PASSWORD"] ?: "",
                    driver = POSTGRES_DRIVER,
                )
            }

            val requiredParts = listOf("DB_HOST", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD")
            val partNames = requiredParts + "DB_PORT"
            if (partNames.any { env.value(it) != null }) {
                val missing = requiredParts.filter { env.value(it) == null }
                require(missing.isEmpty()) {
                    "Incomplete DB_* database configuration. Missing: ${missing.joinToString()}"
                }

                val host = requireNotNull(env.value("DB_HOST"))
                val port = env.value("DB_PORT") ?: "5432"
                val database = requireNotNull(env.value("DB_DATABASE"))

                return DatabaseConfig(
                    url = "jdbc:postgresql://$host:$port/$database",
                    user = requireNotNull(env.value("DB_USERNAME")),
                    password = requireNotNull(env.value("DB_PASSWORD")),
                    driver = POSTGRES_DRIVER,
                )
            }

            return env.value("DB_URL")?.let { configFromDatabaseUrl(it, env) }
        }

        private fun configFromDatabaseUrl(
            databaseUrl: String,
            env: Map<String, String>,
        ): DatabaseConfig {
            val uri = URI(databaseUrl)
            require(uri.scheme == "postgresql" || uri.scheme == "postgres") {
                "DB_URL must use postgres:// or postgresql://"
            }
            require(!uri.host.isNullOrBlank()) { "DB_URL must include a host" }
            require(!uri.rawPath.isNullOrBlank() && uri.rawPath != "/") {
                "DB_URL must include a database name"
            }

            val userInfo = uri.userInfo?.split(":", limit = 2)
            val username = env.value("DB_USERNAME") ?: userInfo?.getOrNull(0)
            val password = env.value("DB_PASSWORD") ?: userInfo?.getOrNull(1)

            require(!username.isNullOrBlank()) {
                "DB_URL must include a username, or DB_USERNAME must be set"
            }
            require(password != null) {
                "DB_URL must include a password, or DB_PASSWORD must be set"
            }

            val port = if (uri.port > 0) ":${uri.port}" else ""
            val query = uri.rawQuery?.let { "?$it" } ?: ""
            return DatabaseConfig(
                url = "jdbc:postgresql://${uri.host}$port${uri.rawPath}$query",
                user = username,
                password = password,
                driver = POSTGRES_DRIVER,
            )
        }

        private fun Map<String, String>.value(name: String): String? = this[name]?.takeIf { it.isNotBlank() }
    }
}
