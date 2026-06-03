package no.nav.fagprove.domain

data class FallbackResultat(
    val vedtak: Vedtak,
    val regelresultat: Regelresultat,
)

object EngangsstonadFallback {
    private val ENGANGSSTONAD_BELOP = Penger(92_648)

    fun vurder(soknad: Soknad): FallbackResultat {
        val vedtak =
            if (soknad.erNorskBorger) {
                Vedtak.Engangsstonad(
                    belop = ENGANGSSTONAD_BELOP,
                    begrunnelse = "Opptjeningskravet er ikke oppfylt, men søker er norsk borger",
                )
            } else {
                Vedtak.Avslag(
                    begrunnelse = "Opptjeningskravet er ikke oppfylt og søker er ikke norsk borger",
                )
            }

        return FallbackResultat(
            vedtak = vedtak,
            regelresultat =
                Regelresultat(
                    regel = Regelnavn.ENGANGSSTONAD,
                    status =
                        when (vedtak) {
                            is Vedtak.Engangsstonad -> RegelStatus.OPPFYLT
                            is Vedtak.Avslag -> RegelStatus.IKKE_OPPFYLT
                            is Vedtak.Innvilget,
                            is Vedtak.ManuellVurdering,
                            -> error("Engangsstønad-fallback kan bare gi engangsstønad eller avslag")
                        },
                    begrunnelse =
                        when (vedtak) {
                            is Vedtak.Engangsstonad -> "Søker får engangsstønad på ${vedtak.belop.kroner} kr"
                            is Vedtak.Avslag -> vedtak.begrunnelse
                            is Vedtak.Innvilget,
                            is Vedtak.ManuellVurdering,
                            -> error("Engangsstønad-fallback kan bare gi engangsstønad eller avslag")
                        },
                ),
        )
    }
}
