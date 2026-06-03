package no.nav.fagprove.dto

import kotlinx.serialization.Serializable

@Serializable
data class UserRequest(
    val name: String,
    val age: Int,
)
