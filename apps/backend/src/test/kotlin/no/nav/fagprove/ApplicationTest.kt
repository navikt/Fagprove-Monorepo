package no.nav.fagprove

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ApplicationTest {
    private fun testApp(block: suspend ApplicationTestBuilder.() -> Unit) =
        testApplication {
            application { module() }
            block()
        }

    // ── Root ──────────────────────────────────────────────────────────────

    @Test
    fun `GET - returns 200`() =
        testApp {
            client.get("/").apply {
                assertEquals(HttpStatusCode.OK, status)
            }
        }

    @Test
    fun `GET hello - returns JSON greeting`() =
        testApp {
            val response = client.get("/hello")
            assertEquals(HttpStatusCode.OK, response.status)
            assertTrue(response.contentType()?.match(ContentType.Application.Json) == true)
            assertTrue(response.bodyAsText().contains("\"message\":\"Hello World!\""))
        }

    // ── Observability ─────────────────────────────────────────────────────

    @Test
    fun `GET isalive - returns 200`() =
        testApp {
            assertEquals(HttpStatusCode.OK, client.get("/isalive").status)
        }

    @Test
    fun `GET isready - returns 200`() =
        testApp {
            assertEquals(HttpStatusCode.OK, client.get("/isready").status)
        }

    @Test
    fun `GET internal isalive - returns 200`() =
        testApp {
            assertEquals(HttpStatusCode.OK, client.get("/internal/isalive").status)
        }

    @Test
    fun `GET internal isready - returns 200`() =
        testApp {
            assertEquals(HttpStatusCode.OK, client.get("/internal/isready").status)
        }

    @Test
    fun `GET internal metrics - returns Prometheus metrics`() =
        testApp {
            val response = client.get("/internal/metrics")
            assertEquals(HttpStatusCode.OK, response.status)
            assertTrue(response.bodyAsText().contains("ktor_http_server_requests"))
        }
}
