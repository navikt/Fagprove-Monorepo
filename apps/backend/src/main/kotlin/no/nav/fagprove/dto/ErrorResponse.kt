package no.nav.fagprove.dto

import kotlinx.serialization.Serializable

/**
 * RFC 7807 Problem Details response.
 */
@Serializable
data class ErrorResponse(
    val type: String = "about:blank",
    val title: String,
    val status: Int,
    val detail: String? = null,
    val errors: List<FieldError> = emptyList(),
)

@Serializable
data class FieldError(
    val field: String,
    val message: String,
)
