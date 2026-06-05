package no.nav.fagprove.routes

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import no.nav.fagprove.application.DemoResetService
import no.nav.fagprove.dto.BehandlingResultatResponse
import no.nav.fagprove.dto.DemoResetResponse
import no.nav.fagprove.dto.ErrorResponse
import no.nav.fagprove.dto.InternMerknadRequest
import no.nav.fagprove.dto.InternMerknadResponse
import no.nav.fagprove.dto.InterneMerknaderResponse
import no.nav.fagprove.dto.ManuellBeslutningRequest
import no.nav.fagprove.dto.ManuellBeslutningTypeDto
import no.nav.fagprove.dto.SakResponse
import no.nav.fagprove.dto.SakStatusDto
import no.nav.fagprove.dto.SoknadListeResponse
import no.nav.fagprove.dto.StartBehandlingRequest
import no.nav.fagprove.dto.VedtaksvariantDto
import no.nav.fagprove.plugins.configureAuthentication
import no.nav.fagprove.plugins.configureRouting
import no.nav.fagprove.plugins.configureSerialization
import no.nav.fagprove.repository.BehandlingRepository
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

    private fun testApp(
        enforceAuth: Boolean = false,
        demoResetEnabled: Boolean = false,
        block: suspend ApplicationTestBuilder.(HttpClient) -> Unit,
    ) = testApplication {
        application {
            val database = repositoryTestDatabase()
            val soknadRepository = SoknadRepository(database)
            TestSoknadSeeder(soknadRepository).seed()

            configureSerialization()
            val authEnabled =
                if (enforceAuth) {
                    configureAuthentication(testIdPortenEnv())
                } else {
                    false
                }
            val demoReset =
                if (demoResetEnabled) {
                    DemoResetService(
                        behandlingRepository = BehandlingRepository(database),
                        reseed = { TestSoknadSeeder(soknadRepository).seed().size },
                    )::reset
                } else {
                    null
                }
            configureRouting(
                database = database,
                enforceForeldrepengerAuth = authEnabled,
                demoReset = demoReset,
            )
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
            val response = client.get("$API_BASE/soknader")

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
    fun `gammel api-sti er ikke tilgjengelig`() =
        testApp { client ->
            val response = client.get("$LEGACY_API_BASE/soknader")

            assertEquals(HttpStatusCode.NotFound, response.status)
        }

    @Test
    fun `foreldrepenger api krever token naar ID-porten er konfigurert`() =
        testApp(enforceAuth = true) { client ->
            val response = client.get("$API_BASE/soknader")

            assertEquals(HttpStatusCode.Unauthorized, response.status)
            val error = response.errorBody()
            assertEquals("Unauthorized", error.title)
            assertEquals(401, error.status)
            assertEquals("Token mangler eller er ugyldig", error.detail)
            assertEquals(HttpStatusCode.OK, client.get("/internal/isready").status)
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
    fun `starter behandling idempotent for samme soknad`() =
        testApp { client ->
            val forste = client.startBehandling(TestSoknader.innvilgetId)
            val replayResponse =
                client.post("$API_BASE/vedtak") {
                    contentType(ContentType.Application.Json)
                    setBody(StartBehandlingRequest(TestSoknader.innvilgetId.toString()))
                }

            assertEquals(HttpStatusCode.OK, replayResponse.status)
            val replay = replayResponse.body<BehandlingResultatResponse>()
            assertEquals(forste.sakId, replay.sakId)
            assertEquals(forste.soknadId, replay.soknadId)
            assertEquals(forste.status, replay.status)
            assertEquals(forste.vedtaksvariant, replay.vedtaksvariant)
        }

    @Test
    fun `avviser ugyldig soknad id med strukturert feil`() =
        testApp { client ->
            val response =
                client.post("$API_BASE/vedtak") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"soknadId":"ikke-en-uuid"}""")
                }

            assertEquals(HttpStatusCode.BadRequest, response.status)
            val error = response.errorBody()
            assertEquals("Bad Request", error.title)
            assertEquals(400, error.status)
            assertEquals("soknadId", error.errors.single().field)
            assertEquals("soknadId må være en gyldig UUID", error.errors.single().message)
        }

    @Test
    fun `avviser ugyldig request body med trygg strukturert feil`() =
        testApp { client ->
            val response =
                client.post("$API_BASE/vedtak") {
                    contentType(ContentType.Application.Json)
                    setBody("""{}""")
                }

            assertEquals(HttpStatusCode.BadRequest, response.status)
            val responseText = response.bodyAsText()
            val error = serializer.decodeFromString<ErrorResponse>(responseText)
            assertEquals("Bad Request", error.title)
            assertEquals(400, error.status)
            assertEquals("Forespørselen har ugyldig JSON eller mangler påkrevde felter", error.detail)
            assertFalse(responseText.contains("MissingFieldException"))
            assertFalse(responseText.contains("StartBehandlingRequest"))
            assertFalse(responseText.contains("kotlinx.serialization"))
        }

    @Test
    fun `henter sak med saksdata og regelspor`() =
        testApp { client ->
            val behandling = client.startBehandling(TestSoknader.innvilgetId)

            val response = client.get("$API_BASE/saker/${behandling.sakId}")

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
    fun `henter tom intern merknad for eksisterende sak`() =
        testApp { client ->
            val behandling = client.startBehandling(TestSoknader.innvilgetId)

            val response = client.get("$API_BASE/saker/${behandling.sakId}/intern-merknad")

            assertEquals(HttpStatusCode.OK, response.status)
            val merknad = response.body<InternMerknadResponse>()
            assertEquals(behandling.sakId, merknad.sakId)
            assertEquals(false, merknad.komplisert)
            assertEquals("", merknad.kommentar)
            assertNull(merknad.oppdatertAv)
            assertNull(merknad.oppdatertTidspunkt)
        }

    @Test
    fun `oppretter og oppdaterer intern merknad for sak`() =
        testApp { client ->
            val behandling = client.startBehandling(TestSoknader.innvilgetId)

            val opprettet =
                client
                    .putInternMerknad(
                        sakId = behandling.sakId,
                        request =
                            InternMerknadRequest(
                                komplisert = true,
                                kommentar = "  Krevde ekstra kvalitetssikring  ",
                                oppdatertAv = " Z990123 ",
                            ),
                    ).body<InternMerknadResponse>()

            assertEquals(behandling.sakId, opprettet.sakId)
            assertEquals(true, opprettet.komplisert)
            assertEquals("Krevde ekstra kvalitetssikring", opprettet.kommentar)
            assertEquals("Z990123", opprettet.oppdatertAv)
            assertNotNull(opprettet.oppdatertTidspunkt)

            val oppdatert =
                client
                    .putInternMerknad(
                        sakId = behandling.sakId,
                        request =
                            InternMerknadRequest(
                                komplisert = false,
                                kommentar = "",
                                oppdatertAv = "Z990456",
                            ),
                    ).body<InternMerknadResponse>()

            assertEquals(behandling.sakId, oppdatert.sakId)
            assertEquals(false, oppdatert.komplisert)
            assertEquals("", oppdatert.kommentar)
            assertEquals("Z990456", oppdatert.oppdatertAv)
        }

    @Test
    fun `avviser ugyldig sak id med strukturert feil`() =
        testApp { client ->
            val response = client.get("$API_BASE/saker/ikke-et-tall")

            assertEquals(HttpStatusCode.BadRequest, response.status)
            val error = response.errorBody()
            assertEquals("Bad Request", error.title)
            assertEquals(400, error.status)
            assertEquals("id", error.errors.single().field)
            assertEquals("Sak id må være et positivt heltall", error.errors.single().message)
        }

    @Test
    fun `avviser ugyldig intern merknad sak id med strukturert feil`() =
        testApp { client ->
            val response =
                client.put("$API_BASE/saker/0/intern-merknad") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        InternMerknadRequest(
                            komplisert = true,
                            kommentar = "Krevende sak",
                            oppdatertAv = "Z990123",
                        ),
                    )
                }

            assertEquals(HttpStatusCode.BadRequest, response.status)
            val error = response.errorBody()
            assertEquals("id", error.errors.single().field)
            assertEquals("Sak id må være et positivt heltall", error.errors.single().message)
        }

    @Test
    fun `avviser ugyldige verdier for intern merknad`() =
        testApp { client ->
            val behandling = client.startBehandling(TestSoknader.innvilgetId)

            val missingComment =
                client.put("$API_BASE/saker/${behandling.sakId}/intern-merknad") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"komplisert":true,"oppdatertAv":"Z990123"}""")
                }
            assertEquals(HttpStatusCode.BadRequest, missingComment.status)
            assertEquals("kommentar", missingComment.firstErrorField())

            val tooLongComment =
                client.putInternMerknad(
                    sakId = behandling.sakId,
                    request =
                        InternMerknadRequest(
                            komplisert = false,
                            kommentar = "x".repeat(1001),
                            oppdatertAv = "Z990123",
                        ),
                )
            assertEquals(HttpStatusCode.BadRequest, tooLongComment.status)
            assertEquals("kommentar", tooLongComment.firstErrorField())

            val emptyCommentForMarkedCase =
                client.putInternMerknad(
                    sakId = behandling.sakId,
                    request =
                        InternMerknadRequest(
                            komplisert = true,
                            kommentar = " ",
                            oppdatertAv = "Z990123",
                        ),
                )
            assertEquals(HttpStatusCode.BadRequest, emptyCommentForMarkedCase.status)
            assertEquals("kommentar", emptyCommentForMarkedCase.firstErrorField())

            val missingOppdatertAv =
                client.put("$API_BASE/saker/${behandling.sakId}/intern-merknad") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"komplisert":false,"kommentar":""}""")
                }
            assertEquals(HttpStatusCode.BadRequest, missingOppdatertAv.status)
            assertEquals("oppdatertAv", missingOppdatertAv.firstErrorField())

            val tooLongOppdatertAv =
                client.putInternMerknad(
                    sakId = behandling.sakId,
                    request =
                        InternMerknadRequest(
                            komplisert = false,
                            kommentar = "",
                            oppdatertAv = "Z".repeat(101),
                        ),
                )
            assertEquals(HttpStatusCode.BadRequest, tooLongOppdatertAv.status)
            assertEquals("oppdatertAv", tooLongOppdatertAv.firstErrorField())
        }

    @Test
    fun `returnerer trygg strukturert 404 for manglende sak`() =
        testApp { client ->
            val response = client.get("$API_BASE/saker/999999")

            assertEquals(HttpStatusCode.NotFound, response.status)
            val responseText = response.bodyAsText()
            val error = serializer.decodeFromString<ErrorResponse>(responseText)
            assertEquals("Not Found", error.title)
            assertEquals(404, error.status)
            assertEquals("Saken finnes ikke", error.detail)
            assertFalse(responseText.contains("999999"))
        }

    @Test
    fun `intern merknad krever eksisterende sak`() =
        testApp { client ->
            val response = client.get("$API_BASE/saker/999999/intern-merknad")

            assertEquals(HttpStatusCode.NotFound, response.status)
            assertEquals("Saken finnes ikke", response.errorBody().detail)
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
                client.post("$API_BASE/saker/${behandling.sakId}/beslutning") {
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
                client.post("$API_BASE/saker/${behandling.sakId}/beslutning") {
                    contentType(ContentType.Application.Json)
                    setBody(request)
                }
            assertEquals(HttpStatusCode.Conflict, duplicateResponse.status)
            val duplicateError = duplicateResponse.errorBody()
            assertEquals("Conflict", duplicateError.title)
            assertEquals(409, duplicateError.status)
            assertEquals("Saken venter ikke på manuell beslutning", duplicateError.detail)
        }

    @Test
    fun `avviser ugyldig manuell beslutning uten aa endre sak`() =
        testApp { client ->
            val behandling = client.startBehandling(TestSoknader.manuellVurderingId)
            val request =
                ManuellBeslutningRequest(
                    type = ManuellBeslutningTypeDto.INNVILGELSE,
                    begrunnelse = " ",
                    besluttetAv = " ",
                )

            val response =
                client.post("$API_BASE/saker/${behandling.sakId}/beslutning") {
                    contentType(ContentType.Application.Json)
                    setBody(request)
                }

            assertEquals(HttpStatusCode.BadRequest, response.status)
            val error = response.errorBody()
            assertEquals("Bad Request", error.title)
            assertEquals(400, error.status)
            assertEquals("Manuell beslutning inneholder ugyldige verdier", error.detail)
            assertContentEquals(
                listOf("begrunnelse", "besluttetAv"),
                error.errors.map { it.field },
            )

            val sakEtterFeil =
                client
                    .get("$API_BASE/saker/${behandling.sakId}")
                    .body<SakResponse>()
            assertEquals(SakStatusDto.TIL_MANUELL_VURDERING, sakEtterFeil.status)
            assertNull(sakEtterFeil.vedtak)
            assertNotNull(sakEtterFeil.manuellVurdering)
        }

    @Test
    fun `avviser ugyldig manuell beslutningstype med trygg feil`() =
        testApp { client ->
            val behandling = client.startBehandling(TestSoknader.manuellVurderingId)
            val response =
                client.post("$API_BASE/saker/${behandling.sakId}/beslutning") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"type":"UGYLDIG","begrunnelse":"Kontrollert","besluttetAv":"Z990123"}""")
                }

            assertEquals(HttpStatusCode.BadRequest, response.status)
            val responseText = response.bodyAsText()
            val error = serializer.decodeFromString<ErrorResponse>(responseText)
            assertEquals("Bad Request", error.title)
            assertEquals(400, error.status)
            assertFalse(responseText.contains("UGYLDIG"))
            assertFalse(responseText.contains("ManuellBeslutningTypeDto"))

            val sakEtterFeil =
                client
                    .get("$API_BASE/saker/${behandling.sakId}")
                    .body<SakResponse>()
            assertEquals(SakStatusDto.TIL_MANUELL_VURDERING, sakEtterFeil.status)
            assertNull(sakEtterFeil.vedtak)
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

    @Test
    fun `oversikt returnerer kun saker med intern oppfolging`() =
        testApp { client ->
            val markert = client.startBehandling(TestSoknader.innvilgetId)
            val ikkeMarkert = client.startBehandling(TestSoknader.avslagId)

            client.putInternMerknad(
                sakId = markert.sakId,
                request =
                    InternMerknadRequest(
                        komplisert = true,
                        kommentar = "Krevde ekstra kvalitetssikring",
                        oppdatertAv = "Z990123",
                    ),
            )
            client.putInternMerknad(
                sakId = ikkeMarkert.sakId,
                request =
                    InternMerknadRequest(
                        komplisert = false,
                        kommentar = "",
                        oppdatertAv = "Z990456",
                    ),
            )

            val response = client.get("$API_BASE/interne-merknader")

            assertEquals(HttpStatusCode.OK, response.status)
            val oversikt = response.body<InterneMerknaderResponse>()
            assertEquals(1, oversikt.saker.size)
            val sak = oversikt.saker.single()
            assertEquals(markert.sakId, sak.sakId)
            assertEquals("SAK-${markert.sakId.toString().padStart(6, '0')}", sak.saksnummer)
            assertEquals("TEST-0001", sak.sokerIdent)
            assertEquals(SakStatusDto.FERDIGSTILT, sak.status)
            assertEquals(VedtaksvariantDto.INNVILGET, sak.vedtaksvariant)
            assertEquals(true, sak.komplisert)
            assertEquals("Krevde ekstra kvalitetssikring", sak.kommentar)
            assertEquals("Z990123", sak.oppdatertAv)
            assertNotNull(sak.oppdatertTidspunkt)
        }

    @Test
    fun `demo reset er ikke tilgjengelig naar flagget er av`() =
        testApp(demoResetEnabled = false) { client ->
            val response = client.post("$API_BASE/demo/reset")

            assertEquals(HttpStatusCode.NotFound, response.status)
        }

    @Test
    fun `demo reset nullstiller behandlinger og beholder seedede soknader`() =
        testApp(demoResetEnabled = true) { client ->
            val behandling = client.startBehandling(TestSoknader.innvilgetId)
            assertEquals(
                HttpStatusCode.OK,
                client.get("$API_BASE/saker/${behandling.sakId}").status,
            )

            val resetResponse = client.post("$API_BASE/demo/reset")

            assertEquals(HttpStatusCode.OK, resetResponse.status)
            assertEquals(5, resetResponse.body<DemoResetResponse>().antallSoknader)

            assertEquals(
                HttpStatusCode.NotFound,
                client.get("$API_BASE/saker/${behandling.sakId}").status,
            )

            val soknader =
                client
                    .get("$API_BASE/soknader")
                    .body<SoknadListeResponse>()
            assertEquals(5, soknader.soknader.size)
            assertContentEquals(
                TestSoknader.alle.map { it.id.toString() },
                soknader.soknader.map { it.id },
            )
        }

    private suspend fun HttpClient.startBehandling(soknadId: UUID): BehandlingResultatResponse {
        val response =
            post("$API_BASE/vedtak") {
                contentType(ContentType.Application.Json)
                setBody(StartBehandlingRequest(soknadId.toString()))
            }

        assertEquals(HttpStatusCode.Created, response.status)
        return response.body()
    }

    private suspend fun HttpClient.putInternMerknad(
        sakId: Long,
        request: InternMerknadRequest,
    ): HttpResponse =
        put("$API_BASE/saker/$sakId/intern-merknad") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }

    private suspend fun HttpResponse.errorBody(): ErrorResponse = serializer.decodeFromString(bodyAsText())

    private suspend fun HttpResponse.firstErrorField(): String = errorBody().errors.single().field

    private companion object {
        const val API_BASE = "/api/v1/foreldrepenger"
        const val LEGACY_API_BASE = "/api/foreldrepenger"

        fun testIdPortenEnv(): Map<String, String> =
            mapOf(
                "IDPORTEN_ISSUER" to "https://issuer.example",
                "IDPORTEN_JWKS_URI" to "https://issuer.example/jwks.json",
                "IDPORTEN_AUDIENCE" to "fagprove-backend",
            )
    }
}
