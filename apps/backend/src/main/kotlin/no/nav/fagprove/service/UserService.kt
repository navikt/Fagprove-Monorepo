package no.nav.fagprove.service

import no.nav.fagprove.domain.User
import no.nav.fagprove.dto.UserRequest
import no.nav.fagprove.dto.UserResponse
import no.nav.fagprove.repository.UserRepository

class UserService(
    private val repository: UserRepository,
) {
    suspend fun create(request: UserRequest): Int {
        val user = User(name = request.name, age = request.age)
        return repository.create(user)
    }

    suspend fun getAll(): List<UserResponse> = repository.findAll()

    suspend fun getById(id: Int): UserResponse? {
        val user = repository.findById(id) ?: return null
        return UserResponse(id = id, name = user.name, age = user.age)
    }

    suspend fun update(
        id: Int,
        request: UserRequest,
    ): Int {
        val user = User(name = request.name, age = request.age)
        return repository.update(id, user)
    }

    suspend fun delete(id: Int): Int = repository.delete(id)
}
