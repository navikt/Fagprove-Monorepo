package no.nav.fagprove.domain

sealed interface Grunnlag {
    data class OK(
        val belop: Penger,
        val beregnetAarsinntekt: Penger = belop,
    ) : Grunnlag

    data class ManuellVurdering(
        val grunn: String,
    ) : Grunnlag
}
