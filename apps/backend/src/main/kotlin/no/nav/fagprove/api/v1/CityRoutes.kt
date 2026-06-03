package no.nav.fagprove.api.v1

import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import no.nav.fagprove.dto.CityRequest
import no.nav.fagprove.service.CityService

fun Route.cityRoutes(cityService: CityService) {
    route("/cities") {
        get {
            val cities = cityService.getAll()
            call.respond(HttpStatusCode.OK, cities)
        }
        post {
            val request = call.receive<CityRequest>()
            request.validate()
            val id = cityService.create(request)
            call.respond(HttpStatusCode.Created, id)
        }
        get("/{id}") {
            val id =
                call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Ugyldig ID")
            val city = cityService.getById(id)
            if (city != null) {
                call.respond(HttpStatusCode.OK, city)
            } else {
                call.respond(HttpStatusCode.NotFound)
            }
        }
        put("/{id}") {
            val id =
                call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Ugyldig ID")
            val request = call.receive<CityRequest>()
            request.validate()
            val updated = cityService.update(id, request)
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
            val deleted = cityService.delete(id)
            if (deleted > 0) {
                call.respond(HttpStatusCode.OK)
            } else {
                call.respond(HttpStatusCode.NotFound)
            }
        }
    }
}

private fun CityRequest.validate() {
    require(name.isNotBlank()) { "Navn kan ikke være tomt" }
    require(name.length <= 255) { "Navn kan være maks 255 tegn" }
    require(population >= 0) { "Innbyggertall kan ikke være negativt" }
}
