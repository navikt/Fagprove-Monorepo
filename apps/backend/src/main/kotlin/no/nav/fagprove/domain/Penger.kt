package no.nav.fagprove.domain

data class Penger(
    val kroner: Int,
) {
    init {
        require(kroner >= 0) { "Beløp kan ikke være negativt: $kroner" }
    }
}
