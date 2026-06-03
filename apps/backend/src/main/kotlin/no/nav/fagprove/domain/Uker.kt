package no.nav.fagprove.domain

@JvmInline
value class Uker(
    val antall: Int,
) {
    init {
        require(antall >= 0) { "Antall uker kan ikke være negativt: $antall" }
    }
}
