package no.nav.fagprove.domain

data class StonadsperiodeResultat(
    val stonadsperiode: Stonadsperiode,
    val regelresultat: Regelresultat,
)

object StonadsperiodeOppslag {
    fun finn(soknad: Soknad): StonadsperiodeResultat {
        val totalUker = soknad.totalStonadsuker()
        val fra = soknad.termindato.minusWeeks(3)
        val periode =
            Periode(
                fra = fra,
                til = fra.plusWeeks(totalUker.toLong()).minusDays(1),
            )

        return StonadsperiodeResultat(
            stonadsperiode =
                Stonadsperiode(
                    periode = periode,
                    totalUker = Uker(totalUker),
                ),
            regelresultat =
                Regelresultat(
                    regel = Regelnavn.STONADSPERIODE,
                    status = RegelStatus.OPPFYLT,
                    begrunnelse = "Stønadsperioden er $totalUker uker ved ${soknad.dekningsgrad.prosent} % dekning",
                ),
        )
    }
}

fun Soknad.totalStonadsuker(): Int = grunnperiodeUker() + flerbarnstilleggUker()

fun Soknad.grunnperiodeUker(): Int =
    when (rettsforhold) {
        Rettsforhold.KUN_FAR -> dekningsgrad.grunnperiodeKunFarUker
        Rettsforhold.BEGGE_FORELDRE, Rettsforhold.KUN_MOR -> dekningsgrad.grunnperiodeBeggeUker
    }

fun Soknad.flerbarnstilleggUker(): Int =
    when (antallBarn) {
        1 -> 0
        2 -> dekningsgrad.tvillingtilleggUker
        else -> dekningsgrad.treEllerFlereBarnTilleggUker
    }
