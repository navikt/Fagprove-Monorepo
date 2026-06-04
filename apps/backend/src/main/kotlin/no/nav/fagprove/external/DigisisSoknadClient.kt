package no.nav.fagprove.external

import kotlinx.serialization.SerializationException
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.io.IOException
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.charset.StandardCharsets
import java.time.Duration

interface DigisisSoknadClient {
    fun hentSoknader(): List<DigisisSoknadDto>
}

class HttpDigisisSoknadClient(
    private val sourceUrl: URI,
    private val httpClient: HttpClient =
        HttpClient
            .newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build(),
    private val json: Json = digisisJson,
) : DigisisSoknadClient {
    override fun hentSoknader(): List<DigisisSoknadDto> {
        val request =
            HttpRequest
                .newBuilder(sourceUrl)
                .timeout(Duration.ofSeconds(20))
                .GET()
                .header("Accept", "application/json")
                .build()

        val response =
            try {
                httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
            } catch (cause: IOException) {
                throw DigisisSoknadClientException(
                    "Kunne ikke hente Digisis-søknader fra ${sourceUrl.host}",
                    cause,
                )
            } catch (cause: InterruptedException) {
                Thread.currentThread().interrupt()
                throw DigisisSoknadClientException(
                    "Henting av Digisis-søknader fra ${sourceUrl.host} ble avbrutt",
                    cause,
                )
            }

        if (response.statusCode() !in 200..299) {
            throw DigisisSoknadClientException(
                "Digisis-søknadskilde svarte med HTTP ${response.statusCode()} fra ${sourceUrl.host}",
            )
        }

        return try {
            json.decodeFromString(response.body())
        } catch (cause: SerializationException) {
            throw DigisisSoknadClientException(
                "Digisis-søknadskilde returnerte ugyldig JSON",
                cause,
            )
        }
    }
}

class DigisisSoknadClientException(
    message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)

internal val digisisJson =
    Json {
        ignoreUnknownKeys = true
        isLenient = false
    }
