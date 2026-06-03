package no.nav.fagprove.api

import io.ktor.http.HttpStatusCode
import no.nav.fagprove.dto.FieldError

open class ApiException(
    val statusCode: HttpStatusCode,
    val title: String = statusCode.description,
    val safeDetail: String? = null,
    val type: String = "about:blank",
    val errors: List<FieldError> = emptyList(),
) : RuntimeException("${statusCode.value} $title")

class ApiValidationException(
    detail: String = "Forespørselen inneholder ugyldige verdier",
    errors: List<FieldError> = emptyList(),
) : ApiException(
        statusCode = HttpStatusCode.BadRequest,
        title = "Bad Request",
        safeDetail = detail,
        errors = errors,
    )

class ApiNotFoundException(
    detail: String,
) : ApiException(
        statusCode = HttpStatusCode.NotFound,
        title = "Not Found",
        safeDetail = detail,
    )

class ApiConflictException(
    detail: String,
) : ApiException(
        statusCode = HttpStatusCode.Conflict,
        title = "Conflict",
        safeDetail = detail,
    )
