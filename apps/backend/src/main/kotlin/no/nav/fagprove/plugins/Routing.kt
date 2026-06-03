package no.nav.fagprove.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import no.nav.fagprove.dto.ErrorResponse
import no.nav.fagprove.repository.BehandlingRepository
import no.nav.fagprove.repository.SoknadRepository
import no.nav.fagprove.repository.VedtakRepository
import no.nav.fagprove.routes.foreldrepengerRoutes
import org.jetbrains.exposed.v1.jdbc.Database

fun Application.configureRouting(database: Database) {
    install(StatusPages) {
        exception<BadRequestException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(title = "Bad Request", status = 400, detail = cause.message),
            )
        }
        exception<IllegalArgumentException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(title = "Bad Request", status = 400, detail = cause.message),
            )
        }
        exception<Throwable> { call, cause ->
            call.application.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(title = "Internal Server Error", status = 500),
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
