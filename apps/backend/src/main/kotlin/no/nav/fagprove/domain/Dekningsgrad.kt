package no.nav.fagprove.domain

enum class Dekningsgrad(
    val prosent: Int,
    val grunnperiodeUker: Int,
    val tvillingtilleggUker: Int,
    val treEllerFlereBarnTilleggUker: Int,
    val foreldrekvoteUker: Int,
) {
    HUNDRE_PROSENT(
        prosent = 100,
        grunnperiodeUker = 49,
        tvillingtilleggUker = 17,
        treEllerFlereBarnTilleggUker = 46,
        foreldrekvoteUker = 15,
    ),
    ATTI_PROSENT(
        prosent = 80,
        grunnperiodeUker = 59,
        tvillingtilleggUker = 22,
        treEllerFlereBarnTilleggUker = 56,
        foreldrekvoteUker = 19,
    ),
}
