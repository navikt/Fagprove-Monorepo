package no.nav.fagprove.plugins

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class HTTPTest {
    @Test
    fun `allowedCorsOrigins defaults to local Astro dev server`() {
        assertEquals(
            listOf(AllowedCorsOrigin(host = "localhost:4321", scheme = "http")),
            allowedCorsOrigins(emptyMap()),
        )
    }

    @Test
    fun `allowedCorsOrigins parses comma separated origins`() {
        assertEquals(
            listOf(
                AllowedCorsOrigin(host = "localhost:4321", scheme = "http"),
                AllowedCorsOrigin(host = "fagprove.nav.no", scheme = "https"),
            ),
            allowedCorsOrigins(
                mapOf("ALLOWED_ORIGINS" to "http://localhost:4321, https://fagprove.nav.no"),
            ),
        )
    }

    @Test
    fun `allowedCorsOrigins rejects origins with paths`() {
        val error =
            assertFailsWith<IllegalArgumentException> {
                allowedCorsOrigins(mapOf("ALLOWED_ORIGINS" to "https://fagprove.nav.no/api"))
            }

        assertEquals(
            "ALLOWED_ORIGINS entries must not include path, query, or fragment: https://fagprove.nav.no/api",
            error.message,
        )
    }

    @Test
    fun `allowedCorsOrigins rejects non-http schemes`() {
        val error =
            assertFailsWith<IllegalArgumentException> {
                allowedCorsOrigins(mapOf("ALLOWED_ORIGINS" to "javascript:alert(1)"))
            }

        assertEquals(
            "ALLOWED_ORIGINS must only contain http or https origins: javascript:alert(1)",
            error.message,
        )
    }
}
