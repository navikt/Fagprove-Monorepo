package no.nav.fagprove.domain

sealed interface Vedtak {
    data class Innvilget(
        val belop: Penger,
    ) : Vedtak

    data class Avslag(
        val begrunnelse: String,
    ) : Vedtak

    data class Engangsstonad(
        val belop: Penger,
    ) : Vedtak

    data class ManuellVurdering(
        val grunn: String,
    ) : Vedtak
}
