package no.nav.fagprove.routes

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import no.nav.fagprove.dto.BehandlingResultatResponse
import no.nav.fagprove.dto.ManuellBeslutningRequest
import no.nav.fagprove.dto.ManuellBeslutningTypeDto
import no.nav.fagprove.dto.SakResponse
import no.nav.fagprove.dto.SakStatusDto
import no.nav.fagprove.dto.SoknadListeResponse
import no.nav.fagprove.dto.StartBehandlingRequest
import no.nav.fagprove.dto.VedtaksvariantDto
import no.nav.fagprove.plugins.configureRouting
import no.nav.fagprove.plugins.configureSerialization
import no.nav.fagprove.repository.SoknadRepository
import no.nav.fagprove.repository.repositoryTestDatabase
import no.nav.fagprove.seed.TestSoknadSeeder
import no.nav.fagprove.seed.TestSoknader
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ForeldrepengerRoutesTest {
    private val serializer = Json { ignoreUnknownKeys = true }

    private fun testApp(block: suspend ApplicationTestBuilder.(HttpClient) -> Unit) =
        testApplication {
            application {
                val database = repositoryTestDatabase()
                TestSoknadSeeder(SoknadRepository(database)).seed()

                configureSerialization()
                configureRouting(database)
            }

            val client =
                createClient {
                    install(ContentNegotiation) {
                        json(serializer)
                    }
                }

            block(client)
        }

    @Test
    fun `lister seedede soknader uten full foedselsnummer`() =
        testApp { client ->
            val response = client.get("/api/foreldrepenger/soknader")

            assertEquals(HttpStatusCode.OK, response.status)
            val responseText = response.bodyAsText()
            val body = serializer.decodeFromString<SoknadListeResponse>(responseText)
            assertEquals(5, body.soknader.size)
            assertContentEquals(
                TestSoknader.alle.map { it.id.toString() },
                body.soknader.map { it.id },
            )
            assertEquals("TEST-0001", body.soknader.first().sokerIdent)
            assertFalse(responseText.contains("00000000001"))
        }

    @Test
    fun `starter behandling og returnerer innvilget vedtak`() =
        testApp { client ->
            val response = client.startBehandling(TestSoknader.innvilgetId)

            assertTrue(response.sakId > 0)
            assertEquals(TestSoknader.innvilgetId.toString(), response.soknadId)
            assertEquals(SakStatusDto.FERDIGSTILT, response.status)
            assertEquals(VedtaksvariantDto.INNVILGET, response.vedtaksvariant)
            assertEquals(648_000, response.vedtak?.belopKroner)
            assertEquals(4, response.regelspor.size)
            assertNull(response.manuellVurdering)
        }

    @Test
    fun `henter sak med saksdata og regelspor`() =
        testApp { client ->
            val behandling = client.startBehandling(TestSoknader.innvilgetId)

            val response = client.get("/api/foreldrepenger/saker/${behandling.sakId}")

            assertEquals(HttpStatusCode.OK, response.status)
            val sak = response.body<SakResponse>()
            assertEquals(behandling.sakId, sak.sakId)
            assertEquals(TestSoknader.innvilgetId.toString(), sak.soknad.id)
            assertEquals("TEST-0001", sak.soknad.sokerIdent)
            assertEquals(6, sak.soknad.inntekter.size)
            assertContentEquals(
                listOf("OPPTJENING", "BEREGNINGSGRUNNLAG", "STONADSPERIODE", "KVOTEFORDELING"),
                sak.regelspor.map { it.regel },
            )
            assertNotNull(sak.vedtak)
            assertNull(sak.manuellVurdering)
        }

    @Test
    fun `starter behandling som venter paa manuell vurdering`() =
        testApp { client ->
            val response = client.startBehandling(TestSoknader.manuellVurderingId)

            assertTrue(response.sakId > 0)
            assertEquals(SakStatusDto.TIL_MANUELL_VURDERING, response.status)
            assertEquals(VedtaksvariantDto.MANUELL_VURDERING, response.vedtaksvariant)
            assertEquals(2, response.regelspor.size)
            assertNull(response.vedtak)
            assertNotNull(response.manuellVurdering)
        }

    @Test
    fun `lagrer manuell beslutning og ferdigstiller sak`() =
        testApp { client ->
            val behandling = client.startBehandling(TestSoknader.manuellVurderingId)
            val request =
                ManuellBeslutningRequest(
                    type = ManuellBeslutningTypeDto.INNVILGELSE,
                    begrunnelse = "Saksbehandler har kontrollert inntektsavviket",
                    besluttetAv = "Z990123",
                )

            val response =
                client.post("/api/foreldrepenger/saker/${behandling.sakId}/beslutning") {
                    contentType(ContentType.Application.Json)
                    setBody(request)
                }

            assertEquals(HttpStatusCode.OK, response.status)
            val sak = response.body<SakResponse>()
            assertEquals(SakStatusDto.FERDIGSTILT, sak.status)
            assertEquals(VedtaksvariantDto.INNVILGET, sak.vedtak?.variant)
            assertEquals("Saksbehandler har kontrollert inntektsavviket", sak.vedtak?.begrunnelse)
            assertEquals("Z990123", sak.vedtak?.besluttetAv)
            assertNull(sak.manuellVurdering)

            val duplicateResponse =
                client.post("/api/foreldrepenger/saker/${behandling.sakId}/beslutning") {
                    contentType(ContentType.Application.Json)
                    setBody(request)
                }
            assertEquals(HttpStatusCode.Conflict, duplicateResponse.status)
        }

    @Test
    fun `returnerer automatiske avslag og engangsstonad varianter`() =
        testApp { client ->
            val avslag = client.startBehandling(TestSoknader.avslagId)
            val engangsstonad = client.startBehandling(TestSoknader.engangsstonadId)

            assertEquals(SakStatusDto.FERDIGSTILT, avslag.status)
            assertEquals(VedtaksvariantDto.AVSLAG, avslag.vedtaksvariant)
            assertEquals(VedtaksvariantDto.AVSLAG, avslag.vedtak?.variant)
            assertEquals(SakStatusDto.FERDIGSTILT, engangsstonad.status)
            assertEquals(VedtaksvariantDto.ENGANGSSTONAD, engangsstonad.vedtaksvariant)
            assertEquals(92_648, engangsstonad.vedtak?.belopKroner)
        }

    private suspend fun HttpClient.startBehandling(soknadId: UUID): BehandlingResultatResponse {
        val response =
            post("/api/foreldrepenger/vedtak") {
                contentType(ContentType.Application.Json)
                setBody(StartBehandlingRequest(soknadId.toString()))
            }

        assertEquals(HttpStatusCode.Created, response.status)
        return response.body()
    }
}
