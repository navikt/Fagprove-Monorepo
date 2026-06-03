package no.nav.fagprove.api.v1

import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import no.nav.fagprove.dto.UserRequest
import no.nav.fagprove.service.UserService

fun Route.userRoutes(userService: UserService) {
    route("/users") {
        get {
            val users = userService.getAll()
            call.respond(HttpStatusCode.OK, users)
        }
        post {
            val request = call.receive<UserRequest>()
            request.validate()
            val id = userService.create(request)
            call.respond(HttpStatusCode.Created, id)
        }
        get("/{id}") {
            val id =
                call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Ugyldig ID")
            val user = userService.getById(id)
            if (user != null) {
                call.respond(HttpStatusCode.OK, user)
            } else {
                call.respond(HttpStatusCode.NotFound)
            }
        }
        put("/{id}") {
            val id =
                call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Ugyldig ID")
            val request = call.receive<UserRequest>()
            request.validate()
            val updated = userService.update(id, request)
            if (updated > 0) {
                call.respond(HttpStatusCode.OK)
            } else {
                call.respond(HttpStatusCode.NotFound)
            }
        }
        delete("/{id}") {
            val id =
                call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Ugyldig ID")
            val deleted = userService.delete(id)
            if (deleted > 0) {
                call.respond(HttpStatusCode.OK)
            } else {
                call.respond(HttpStatusCode.NotFound)
            }
        }
    }
}

private fun UserRequest.validate() {
    require(name.isNotBlank()) { "Navn kan ikke være tomt" }
    require(name.length <= 50) { "Navn kan være maks 50 tegn" }
    require(age in 0..150) { "Alder må være mellom 0 og 150" }
}
