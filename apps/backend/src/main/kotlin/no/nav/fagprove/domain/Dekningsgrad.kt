package no.nav.fagprove.domain

enum class Dekningsgrad(
    val prosent: Int,
    val grunnperiodeBeggeUker: Int,
    val grunnperiodeKunFarUker: Int,
    val tvillingtilleggUker: Int,
    val treEllerFlereBarnTilleggUker: Int,
    val foreldrekvoteUker: Int,
) {
    HUNDRE_PROSENT(
        prosent = 100,
        grunnperiodeBeggeUker = 49,
        grunnperiodeKunFarUker = 40,
        tvillingtilleggUker = 17,
        treEllerFlereBarnTilleggUker = 46,
        foreldrekvoteUker = 15,
    ),
    ATTI_PROSENT(
        prosent = 80,
        grunnperiodeBeggeUker = 61,
        grunnperiodeKunFarUker = 52,
        tvillingtilleggUker = 21,
        treEllerFlereBarnTilleggUker = 57,
        foreldrekvoteUker = 19,
    ),
}
