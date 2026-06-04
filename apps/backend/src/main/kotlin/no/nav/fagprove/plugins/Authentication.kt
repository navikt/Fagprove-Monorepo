package no.nav.fagprove.plugins

import com.auth0.jwk.JwkProviderBuilder
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import no.nav.fagprove.dto.ErrorResponse
import java.net.URI
import java.util.concurrent.TimeUnit

/**
 * Konfigurerer autentisering for ID-porten via sidecar (Wonderwall).
 *
 * Når appen kjører bak Wonderwall, håndterer sidecaren OIDC-flyten
 * og videresender den validerte token-en i Authorization-headeren.
 *
 * 🔴 Rød sone — sikkerhetskritisk kode. Forstå dette grundig:
 * - Wonderwall validerer token-en før den videresendes
 * - Vi verifiserer kun at token-en finnes og henter ut claims
 * - I lokal utvikling (ingen IDPORTEN_-variabler) er autentisering AVSLÅTT
 */
internal const val IDPORTEN_AUTH_PROVIDER = "idporten"

fun Application.configureAuthentication(env: Map<String, String> = System.getenv()): Boolean {
    val config =
        resolveIdPortenConfig(env)
            ?: run {
                log.warn("ID-porten not configured — authentication DISABLED (local dev mode)")
                return false
            }

    val jwkProvider =
        JwkProviderBuilder(URI(config.jwksUri).toURL())
            .cached(10, 24, TimeUnit.HOURS)
            .rateLimited(10, 1, TimeUnit.MINUTES)
            .build()

    install(Authentication) {
        jwt(IDPORTEN_AUTH_PROVIDER) {
            verifier(jwkProvider, config.issuer) {
                withAudience(config.audience)
            }
            validate { credential ->
                if (credential.payload.audience.contains(config.audience)) {
                    JWTPrincipal(credential.payload)
                } else {
                    null
                }
            }
            challenge { _, _ ->
                call.respond(
                    HttpStatusCode.Unauthorized,
                    ErrorResponse(
                        title = "Unauthorized",
                        status = 401,
                        detail = "Token mangler eller er ugyldig",
                    ),
                )
            }
        }
    }

    return true
}

internal data class IdPortenConfig(
    val issuer: String,
    val jwksUri: String,
    val audience: String,
)

internal fun resolveIdPortenConfig(env: Map<String, String>): IdPortenConfig? {
    val values =
        mapOf(
            "IDPORTEN_ISSUER" to env.value("IDPORTEN_ISSUER"),
            "IDPORTEN_JWKS_URI" to env.value("IDPORTEN_JWKS_URI"),
            "IDPORTEN_AUDIENCE" to env.value("IDPORTEN_AUDIENCE"),
        )
    val authRequired = env["IDPORTEN_REQUIRED"]?.equals("true", ignoreCase = true) == true

    if (values.values.all { it == null }) {
        require(!authRequired) {
            "IDPORTEN_REQUIRED=true, but ID-porten configuration is missing"
        }
        return null
    }

    val missing = values.filterValues { it == null }.keys
    require(missing.isEmpty()) {
        "Incomplete ID-porten configuration. Missing: ${missing.joinToString()}"
    }

    return IdPortenConfig(
        issuer = requireNotNull(values["IDPORTEN_ISSUER"]),
        jwksUri = requireNotNull(values["IDPORTEN_JWKS_URI"]),
        audience = requireNotNull(values["IDPORTEN_AUDIENCE"]),
    )
}

private fun Map<String, String>.value(name: String): String? = this[name]?.takeIf { it.isNotBlank() }
