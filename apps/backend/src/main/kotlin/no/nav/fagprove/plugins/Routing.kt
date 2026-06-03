package no.nav.fagprove.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.plugins.ContentTransformationException
import io.ktor.server.plugins.UnsupportedMediaTypeException
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.httpMethod
import io.ktor.server.request.path
import io.ktor.server.response.*
import io.ktor.server.routing.*
import no.nav.fagprove.api.ApiException
import no.nav.fagprove.dto.ErrorResponse
import no.nav.fagprove.repository.BehandlingRepository
import no.nav.fagprove.repository.SoknadRepository
import no.nav.fagprove.repository.VedtakRepository
import no.nav.fagprove.routes.foreldrepengerRoutes
import org.jetbrains.exposed.v1.jdbc.Database

fun Application.configureRouting(database: Database) {
    install(StatusPages) {
        exception<ApiException> { call, cause ->
            call.respond(cause.statusCode, cause.toErrorResponse())
        }
        exception<BadRequestException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                cause.toBadRequestResponse(),
            )
        }
        exception<ContentTransformationException> { call, _ ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(
                    title = "Bad Request",
                    status = 400,
                    detail = "Forespørselen har ugyldig format",
                ),
            )
        }
        exception<UnsupportedMediaTypeException> { call, _ ->
            call.respond(
                HttpStatusCode.UnsupportedMediaType,
                ErrorResponse(
                    title = "Unsupported Media Type",
                    status = 415,
                    detail = "Content-Type må være application/json",
                ),
            )
        }
        exception<Throwable> { call, cause ->
            call.application.log.error(
                "Unhandled exception for {} {}. exceptionType={}, topFrame={}",
                call.request.httpMethod.value,
                call.request.path(),
                cause::class.qualifiedName,
                cause.stackTrace.firstOrNull()?.let { "${it.className}.${it.methodName}:${it.lineNumber}" },
            )
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(
                    title = "Internal Server Error",
                    status = 500,
                    detail = "En uventet feil oppstod",
                ),
            )
        }
    }
    routing {
        get("/") {
            call.respondText("Hello World!")
        }
        get("/hello") {
            call.respond(mapOf("message" to "Hello World!"))
        }
        get("/isalive") { call.respond(HttpStatusCode.OK) }
        get("/isready") { call.respond(HttpStatusCode.OK) }
        route("/internal") {
            get("/isalive") { call.respond(HttpStatusCode.OK) }
            get("/isready") { call.respond(HttpStatusCode.OK) }
        }
        foreldrepengerRoutes(
            soknadRepository = SoknadRepository(database),
            behandlingRepository = BehandlingRepository(database),
            vedtakRepository = VedtakRepository(database),
        )
    }
}

private fun ApiException.toErrorResponse(): ErrorResponse =
    ErrorResponse(
        type = type,
        title = title,
        status = statusCode.value,
        detail = safeDetail,
        errors = errors,
    )

private fun BadRequestException.toBadRequestResponse(): ErrorResponse =
    ErrorResponse(
        title = "Bad Request",
        status = 400,
        detail = "Forespørselen har ugyldig JSON eller mangler påkrevde felter",
    )
