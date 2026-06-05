package no.nav.fagprove.config

import java.net.URI

/**
 * Sealed class for environment-based database configuration.
 * Eliminates scattered System.getenv() calls throughout the codebase.
 */
sealed class AppConfig {
    abstract val database: DatabaseConfig
    abstract val digisisSoknadSourceUrl: URI
    abstract val syncExternalSoknader: Boolean
    abstract val seedTestSoknader: Boolean

    /**
     * Når aktiv eksponeres demo-endepunktet for å nullstille saksbehandlingsdata.
     * Aktivert som standard i alle miljøer; kan slås av med DEMO_RESET_ENABLED=false.
     */
    abstract val demoResetEnabled: Boolean

    data class DatabaseConfig(
        val url: String,
        val user: String,
        val password: String,
        val driver: String,
    )

    data class Testcontainers(
        override val database: DatabaseConfig,
        override val digisisSoknadSourceUrl: URI,
        override val syncExternalSoknader: Boolean,
        override val seedTestSoknader: Boolean,
        override val demoResetEnabled: Boolean,
    ) : AppConfig()

    data class External(
        override val database: DatabaseConfig,
        override val digisisSoknadSourceUrl: URI,
        override val syncExternalSoknader: Boolean,
        override val seedTestSoknader: Boolean,
        override val demoResetEnabled: Boolean,
    ) : AppConfig()

    data class InMemory(
        override val database: DatabaseConfig,
        override val digisisSoknadSourceUrl: URI,
        override val syncExternalSoknader: Boolean,
        override val seedTestSoknader: Boolean,
        override val demoResetEnabled: Boolean,
    ) : AppConfig()

    companion object {
        const val DEFAULT_DIGISIS_SOKNAD_SOURCE_URL = "https://api.digisis.org/api/foreldrepenger/soknader"

        private const val POSTGRES_DRIVER = "org.postgresql.Driver"
        private const val DIGISIS_SOKNAD_SOURCE_URL = "DIGISIS_SOKNAD_SOURCE_URL"
        private const val SYNC_EXTERNAL_SOKNADER = "SYNC_EXTERNAL_SOKNADER"
        private const val SEED_TEST_SOKNADER = "SEED_TEST_SOKNADER"
        private const val DEMO_RESET_ENABLED = "DEMO_RESET_ENABLED"

        fun resolve(env: Map<String, String> = System.getenv()): AppConfig {
            val useTestcontainers = env["USE_TESTCONTAINERS"] == "true"
            val postgresUrl = env.value("POSTGRES_URL")
            val naisDatabase = resolveNaisDatabase(env)
            val digisisSoknadSourceUrl = env.digisisSoknadSourceUrl()
            val syncExternalSoknader = env.booleanValue(SYNC_EXTERNAL_SOKNADER)
            val seedTestSoknader = env.booleanValue(SEED_TEST_SOKNADER)
            val demoResetEnabled = env.booleanValue(DEMO_RESET_ENABLED)

            return when {
                useTestcontainers ->
                    // URL/user/password set dynamically after container starts
                    config(
                        database =
                            DatabaseConfig(
                                url = "",
                                user = "",
                                password = "",
                                driver = POSTGRES_DRIVER,
                            ),
                        digisisSoknadSourceUrl = digisisSoknadSourceUrl,
                        syncExternalSoknader = syncExternalSoknader,
                        seedTestSoknader = seedTestSoknader,
                        demoResetEnabled = demoResetEnabled,
                        defaultSyncExternalSoknader = true,
                        defaultSeedTestSoknader = false,
                        factory = ::Testcontainers,
                    )
                naisDatabase != null -> {
                    config(
                        database = naisDatabase,
                        digisisSoknadSourceUrl = digisisSoknadSourceUrl,
                        syncExternalSoknader = syncExternalSoknader,
                        seedTestSoknader = seedTestSoknader,
                        demoResetEnabled = demoResetEnabled,
                        defaultSyncExternalSoknader = true,
                        defaultSeedTestSoknader = false,
                        allowSeedTestSoknader = false,
                        factory = ::External,
                    )
                }
                postgresUrl != null -> {
                    config(
                        database =
                            DatabaseConfig(
                                url = postgresUrl,
                                user = env.value("POSTGRES_USER") ?: "postgres",
                                password = env["POSTGRES_PASSWORD"] ?: "",
                                driver = POSTGRES_DRIVER,
                            ),
                        digisisSoknadSourceUrl = digisisSoknadSourceUrl,
                        syncExternalSoknader = syncExternalSoknader,
                        seedTestSoknader = seedTestSoknader,
                        demoResetEnabled = demoResetEnabled,
                        defaultSyncExternalSoknader = true,
                        defaultSeedTestSoknader = false,
                        allowSeedTestSoknader = false,
                        factory = ::External,
                    )
                }
                else ->
                    config(
                        database =
                            DatabaseConfig(
                                url = "jdbc:h2:mem:test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
                                user = "root",
                                password = "",
                                driver = "org.h2.Driver",
                            ),
                        digisisSoknadSourceUrl = digisisSoknadSourceUrl,
                        syncExternalSoknader = syncExternalSoknader,
                        seedTestSoknader = seedTestSoknader,
                        demoResetEnabled = demoResetEnabled,
                        defaultSyncExternalSoknader = false,
                        defaultSeedTestSoknader = true,
                        factory = ::InMemory,
                    )
            }
        }

        private fun <T : AppConfig> config(
            database: DatabaseConfig,
            digisisSoknadSourceUrl: URI,
            syncExternalSoknader: Boolean?,
            seedTestSoknader: Boolean?,
            demoResetEnabled: Boolean?,
            defaultSyncExternalSoknader: Boolean,
            defaultSeedTestSoknader: Boolean,
            allowSeedTestSoknader: Boolean = true,
            factory: (DatabaseConfig, URI, Boolean, Boolean, Boolean) -> T,
        ): T {
            val resolvedSyncExternalSoknader = syncExternalSoknader ?: defaultSyncExternalSoknader
            val resolvedSeedTestSoknader =
                seedTestSoknader
                    ?: if (resolvedSyncExternalSoknader) {
                        false
                    } else {
                        defaultSeedTestSoknader
                    }

            require(allowSeedTestSoknader || !resolvedSeedTestSoknader) {
                "$SEED_TEST_SOKNADER=true can only be used with in-memory or Testcontainers databases"
            }
            require(!(resolvedSyncExternalSoknader && resolvedSeedTestSoknader)) {
                "$SYNC_EXTERNAL_SOKNADER=true cannot be combined with $SEED_TEST_SOKNADER=true"
            }

            val resolvedDemoResetEnabled = demoResetEnabled ?: true

            return factory(
                database,
                digisisSoknadSourceUrl,
                resolvedSyncExternalSoknader,
                resolvedSeedTestSoknader,
                resolvedDemoResetEnabled,
            )
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

        private fun Map<String, String>.digisisSoknadSourceUrl(): URI {
            val rawUrl = value(DIGISIS_SOKNAD_SOURCE_URL) ?: DEFAULT_DIGISIS_SOKNAD_SOURCE_URL
            val uri = URI(rawUrl)
            require(uri.scheme == "https" || uri.scheme == "http") {
                "$DIGISIS_SOKNAD_SOURCE_URL must use http:// or https://"
            }
            require(!uri.host.isNullOrBlank()) {
                "$DIGISIS_SOKNAD_SOURCE_URL must include a host"
            }
            return uri
        }

        private fun Map<String, String>.booleanValue(name: String): Boolean? =
            value(name)?.let { rawValue ->
                when (rawValue.lowercase()) {
                    "true" -> true
                    "false" -> false
                    else -> throw IllegalArgumentException("$name must be true or false")
                }
            }
    }
}
