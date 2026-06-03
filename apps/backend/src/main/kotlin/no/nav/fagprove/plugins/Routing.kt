package no.nav.fagprove.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import no.nav.fagprove.api.v1.cityRoutes
import no.nav.fagprove.api.v1.userRoutes
import no.nav.fagprove.dto.ErrorResponse
import no.nav.fagprove.service.CityService
import no.nav.fagprove.service.UserService

fun Application.configureRouting(
    cityService: CityService,
    userService: UserService,
) {
    install(StatusPages) {
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
        val authInstalled = pluginOrNull(Authentication) != null
        if (authInstalled) {
            authenticate("idporten") {
                cityRoutes(cityService)
                userRoutes(userService)
            }
        } else {
            cityRoutes(cityService)
            userRoutes(userService)
        }
    }
}
