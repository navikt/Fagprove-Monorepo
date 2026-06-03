package no.nav.fagprove.service

import no.nav.fagprove.domain.City
import no.nav.fagprove.dto.CityRequest
import no.nav.fagprove.dto.CityResponse
import no.nav.fagprove.repository.CityRepository

class CityService(
    private val repository: CityRepository,
) {
    suspend fun create(request: CityRequest): Int {
        val city = City(name = request.name, population = request.population)
        return repository.create(city)
    }

    suspend fun getAll(): List<CityResponse> = repository.findAll()

    suspend fun getById(id: Int): CityResponse? {
        val city = repository.findById(id) ?: return null
        return CityResponse(id = id, name = city.name, population = city.population)
    }

    suspend fun update(
        id: Int,
        request: CityRequest,
    ): Int {
        val city = City(name = request.name, population = request.population)
        return repository.update(id, city)
    }

    suspend fun delete(id: Int): Int = repository.delete(id)
}
