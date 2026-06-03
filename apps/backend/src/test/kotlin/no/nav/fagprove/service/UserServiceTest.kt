package no.nav.fagprove.service

import kotlinx.coroutines.runBlocking
import no.nav.fagprove.dto.UserRequest
import no.nav.fagprove.repository.UserRepository
import org.jetbrains.exposed.v1.jdbc.Database
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class UserServiceTest {
    @Test
    fun `should create and retrieve user`() =
        runBlocking {
            val service = userService()

            val id = service.create(UserRequest(name = "Ola Nordmann", age = 30))
            val user = service.getById(id)

            assertTrue(id > 0)
            assertNotNull(user)
            assertEquals(id, user.id)
            assertEquals("Ola Nordmann", user.name)
            assertEquals(30, user.age)
        }

    @Test
    fun `should update user`() =
        runBlocking {
            val service = userService()
            val id = service.create(UserRequest(name = "Before", age = 20))

            service.update(id, UserRequest(name = "After", age = 21))

            val user = service.getById(id)
            assertNotNull(user)
            assertEquals("After", user.name)
            assertEquals(21, user.age)
        }

    @Test
    fun `should return null after deleting user`() =
        runBlocking {
            val service = userService()
            val id = service.create(UserRequest(name = "DeleteMe", age = 18))

            service.delete(id)

            assertNull(service.getById(id))
        }

    private fun userService(): UserService {
        val database =
            Database.connect(
                url = "jdbc:h2:mem:user-service-${UUID.randomUUID()};MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
                driver = "org.h2.Driver",
                user = "root",
                password = "",
            )
        return UserService(UserRepository(database))
    }
}
