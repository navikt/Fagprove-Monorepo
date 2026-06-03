package no.nav.fagprove.config

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertTrue

class AppConfigTest {
    @Test
    fun `resolve uses Nais Cloud SQL DB variables`() {
        val config =
            AppConfig.resolve(
                mapOf(
                    "DB_HOST" to "postgres.local",
                    "DB_PORT" to "5433",
                    "DB_DATABASE" to "fagprove",
                    "DB_USERNAME" to "app",
                    "DB_PASSWORD" to "secret",
                ),
            )

        assertIs<AppConfig.External>(config)
        assertEquals("jdbc:postgresql://postgres.local:5433/fagprove", config.database.url)
        assertEquals("app", config.database.user)
        assertEquals("secret", config.database.password)
        assertEquals("org.postgresql.Driver", config.database.driver)
        assertFalse(config.seedTestSoknader)
    }

    @Test
    fun `resolve uses DB_JDBC_URL when Nais provides one`() {
        val config =
            AppConfig.resolve(
                mapOf(
                    "DB_JDBC_URL" to "jdbc:postgresql://postgres.local:5432/fagprove",
                    "DB_USERNAME" to "app",
                    "DB_PASSWORD" to "secret",
                ),
            )

        assertIs<AppConfig.External>(config)
        assertEquals("jdbc:postgresql://postgres.local:5432/fagprove", config.database.url)
        assertEquals("app", config.database.user)
        assertFalse(config.seedTestSoknader)
    }

    @Test
    fun `resolve converts DB_URL to a JDBC URL`() {
        val config =
            AppConfig.resolve(
                mapOf(
                    "DB_URL" to "postgresql://app:secret@postgres.local:5432/fagprove?sslmode=require",
                ),
            )

        assertIs<AppConfig.External>(config)
        assertEquals("jdbc:postgresql://postgres.local:5432/fagprove?sslmode=require", config.database.url)
        assertEquals("app", config.database.user)
        assertEquals("secret", config.database.password)
        assertFalse(config.seedTestSoknader)
    }

    @Test
    fun `resolve fails fast on incomplete Nais DB variables`() {
        val error =
            assertFailsWith<IllegalArgumentException> {
                AppConfig.resolve(
                    mapOf(
                        "DB_HOST" to "postgres.local",
                        "DB_DATABASE" to "fagprove",
                    ),
                )
            }

        assertEquals(
            "Incomplete DB_* database configuration. Missing: DB_USERNAME, DB_PASSWORD",
            error.message,
        )
    }

    @Test
    fun `resolve enables test soknad seed for local testcontainers`() {
        val config = AppConfig.resolve(mapOf("USE_TESTCONTAINERS" to "true"))

        assertIs<AppConfig.Testcontainers>(config)
        assertTrue(config.seedTestSoknader)
    }

    @Test
    fun `resolve enables test soknad seed for in-memory tests`() {
        val config = AppConfig.resolve(emptyMap())

        assertIs<AppConfig.InMemory>(config)
        assertTrue(config.seedTestSoknader)
    }

    @Test
    fun `resolve can disable test soknad seed for local databases`() {
        val config =
            AppConfig.resolve(
                mapOf(
                    "USE_TESTCONTAINERS" to "true",
                    "SEED_TEST_SOKNADER" to "false",
                ),
            )

        assertIs<AppConfig.Testcontainers>(config)
        assertFalse(config.seedTestSoknader)
    }

    @Test
    fun `resolve rejects test soknad seed for external databases`() {
        val error =
            assertFailsWith<IllegalArgumentException> {
                AppConfig.resolve(
                    mapOf(
                        "POSTGRES_URL" to "jdbc:postgresql://postgres.local:5432/fagprove",
                        "SEED_TEST_SOKNADER" to "true",
                    ),
                )
            }

        assertEquals(
            "SEED_TEST_SOKNADER=true can only be used with in-memory or Testcontainers databases",
            error.message,
        )
    }
}
