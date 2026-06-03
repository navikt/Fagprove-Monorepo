package no.nav.fagprove.plugins

import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import no.nav.fagprove.dto.ErrorResponse
import no.nav.fagprove.repository.repositoryTestDatabase
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse

class RoutingErrorHandlingTest {
    private val serializer = Json { ignoreUnknownKeys = true }

    @Test
    fun `uventet feil returnerer trygg 500 uten interne detaljer`() =
        testApplication {
            application {
                val database = repositoryTestDatabase()
                configureSerialization()
                configureRouting(database)
                routing {
                    get("/test/uventet-feil") {
                        throw RuntimeException("SQL-feil for fnr 00000000001")
                    }
                }
            }

            val response = client.get("/test/uventet-feil")

            assertEquals(HttpStatusCode.InternalServerError, response.status)
            val responseText = response.bodyAsText()
            val error = serializer.decodeFromString<ErrorResponse>(responseText)
            assertEquals("Internal Server Error", error.title)
            assertEquals(500, error.status)
            assertEquals("En uventet feil oppstod", error.detail)
            assertFalse(responseText.contains("RuntimeException"))
            assertFalse(responseText.contains("SQL-feil"))
            assertFalse(responseText.contains("00000000001"))
        }
}
