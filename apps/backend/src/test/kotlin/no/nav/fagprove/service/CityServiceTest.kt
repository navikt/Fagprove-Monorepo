package no.nav.fagprove.service

import kotlinx.coroutines.runBlocking
import no.nav.fagprove.dto.CityRequest
import no.nav.fagprove.repository.CityRepository
import org.jetbrains.exposed.v1.jdbc.Database
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CityServiceTest {
    @Test
    fun `should create and retrieve city`() =
        runBlocking {
            val service = cityService()

            val id = service.create(CityRequest(name = "Bergen", population = 280000))
            val city = service.getById(id)

            assertTrue(id > 0)
            assertNotNull(city)
            assertEquals(id, city.id)
            assertEquals("Bergen", city.name)
            assertEquals(280000, city.population)
        }

    @Test
    fun `should update city`() =
        runBlocking {
            val service = cityService()
            val id = service.create(CityRequest(name = "OldName", population = 1000))

            service.update(id, CityRequest(name = "NewName", population = 2000))

            val city = service.getById(id)
            assertNotNull(city)
            assertEquals("NewName", city.name)
            assertEquals(2000, city.population)
        }

    @Test
    fun `should return null after deleting city`() =
        runBlocking {
            val service = cityService()
            val id = service.create(CityRequest(name = "DeleteMe", population = 100))

            service.delete(id)

            assertNull(service.getById(id))
        }

    private fun cityService(): CityService {
        val database =
            Database.connect(
                url = "jdbc:h2:mem:city-service-${UUID.randomUUID()};MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
                driver = "org.h2.Driver",
                user = "root",
                password = "",
            )
        return CityService(CityRepository(database))
    }
}
