package no.nav.fagprove.dto

import kotlinx.serialization.Serializable

@Serializable
data class CityResponse(
    val id: Int,
    val name: String,
    val population: Int,
)
