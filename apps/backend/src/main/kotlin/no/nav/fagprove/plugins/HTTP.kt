package no.nav.fagprove.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.swagger.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.net.URI

fun Application.configureHTTP(env: Map<String, String> = System.getenv()) {
    routing {
        swaggerUI(path = "openapi", swaggerFile = "openapi/documentation.yaml")
        get("/openapi.json") {
            val spec = this::class.java.classLoader.getResource("openapi/documentation.yaml")?.readText()
            if (spec != null) {
                call.respondText(spec, ContentType("application", "yaml"))
            } else {
                call.respond(HttpStatusCode.NotFound)
            }
        }
    }
    install(CORS) {
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Patch)
        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.ContentType)
        allowedCorsOrigins(env).forEach { origin ->
            allowHost(
                host = origin.host,
                schemes = listOf(origin.scheme),
            )
        }
    }
}

internal data class AllowedCorsOrigin(
    val host: String,
    val scheme: String,
)

internal fun allowedCorsOrigins(env: Map<String, String>): List<AllowedCorsOrigin> =
    (env["ALLOWED_ORIGINS"] ?: "http://localhost:4321")
        .split(",")
        .map { it.trim() }
        .filter { it.isNotEmpty() }
        .map(::parseAllowedCorsOrigin)

private fun parseAllowedCorsOrigin(origin: String): AllowedCorsOrigin {
    val uri = URI(origin)
    val scheme = uri.scheme?.lowercase()
    require(scheme == "http" || scheme == "https") {
        "ALLOWED_ORIGINS must only contain http or https origins: $origin"
    }
    require(uri.userInfo == null && !uri.host.isNullOrBlank()) {
        "ALLOWED_ORIGINS must contain valid origins without credentials: $origin"
    }
    require((uri.rawPath.isNullOrBlank() || uri.rawPath == "/") && uri.rawQuery == null && uri.rawFragment == null) {
        "ALLOWED_ORIGINS entries must not include path, query, or fragment: $origin"
    }

    val host = uri.host.lowercase()
    return AllowedCorsOrigin(
        host = if (uri.port >= 0) "$host:${uri.port}" else host,
        scheme = scheme,
    )
}
