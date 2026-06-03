package no.nav.fagprove.domain

sealed interface Grunnlag {
    data class OK(
        val belop: Penger,
    ) : Grunnlag

    data class ManuellVurdering(
        val grunn: String,
    ) : Grunnlag
}
