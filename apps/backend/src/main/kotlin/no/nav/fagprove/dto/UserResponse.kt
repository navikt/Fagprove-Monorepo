package no.nav.fagprove.dto

import kotlinx.serialization.Serializable

@Serializable
data class UserResponse(
    val id: Int,
    val name: String,
    val age: Int,
)
