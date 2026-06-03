package no.nav.fagprove.config

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertIs

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
}
