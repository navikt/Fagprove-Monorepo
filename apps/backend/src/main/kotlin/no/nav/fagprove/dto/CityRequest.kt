package no.nav.fagprove.dto

import kotlinx.serialization.Serializable

@Serializable
data class CityRequest(val name: String, val population: Int)
