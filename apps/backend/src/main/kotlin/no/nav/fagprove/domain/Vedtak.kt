package no.nav.fagprove.domain

sealed interface Vedtak {
    data class Innvilget(
        val belop: Penger,
        val stonadsperiode: Stonadsperiode,
        val kvoter: Kvoter,
        val begrunnelse: String = "Søknaden er innvilget",
    ) : Vedtak

    data class Avslag(
        val begrunnelse: String,
    ) : Vedtak

    data class Engangsstonad(
        val belop: Penger,
        val begrunnelse: String = "Søker fyller vilkår for engangsstønad",
    ) : Vedtak

    data class ManuellVurdering(
        val grunn: String,
    ) : Vedtak
}
