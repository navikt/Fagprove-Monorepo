package no.nav.fagprove.plugins

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class AuthenticationTest {
    @Test
    fun `resolveIdPortenConfig returns null when auth is not configured`() {
        assertNull(resolveIdPortenConfig(emptyMap()))
    }

    @Test
    fun `resolveIdPortenConfig resolves complete ID-porten configuration`() {
        val config =
            resolveIdPortenConfig(
                mapOf(
                    "IDPORTEN_ISSUER" to "https://issuer.example",
                    "IDPORTEN_JWKS_URI" to "https://issuer.example/jwks.json",
                    "IDPORTEN_AUDIENCE" to "client-id",
                ),
            )

        assertEquals("https://issuer.example", config?.issuer)
        assertEquals("https://issuer.example/jwks.json", config?.jwksUri)
        assertEquals("client-id", config?.audience)
    }

    @Test
    fun `resolveIdPortenConfig fails fast on partial ID-porten configuration`() {
        val error =
            assertFailsWith<IllegalArgumentException> {
                resolveIdPortenConfig(
                    mapOf(
                        "IDPORTEN_ISSUER" to "https://issuer.example",
                    ),
                )
            }

        assertEquals(
            "Incomplete ID-porten configuration. Missing: IDPORTEN_JWKS_URI, IDPORTEN_AUDIENCE",
            error.message,
        )
    }

    @Test
    fun `resolveIdPortenConfig fails when auth is required but missing`() {
        val error =
            assertFailsWith<IllegalArgumentException> {
                resolveIdPortenConfig(mapOf("IDPORTEN_REQUIRED" to "true"))
            }

        assertEquals("IDPORTEN_REQUIRED=true, but ID-porten configuration is missing", error.message)
    }
}
