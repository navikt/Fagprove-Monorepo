package no.nav.fagprove.domain

import java.time.YearMonth

data class Opptjeningsresultat(
    val oppfylt: Boolean,
    val regelresultat: Regelresultat,
)

object Opptjeningsvurderer {
    private const val MINSTEINNTEKT = 65_080
    private const val KREVDE_INNTEKTSMANEDER = 6
    private const val REFERANSEPERIODE_MANEDER = 10L

    fun vurder(soknad: Soknad): Opptjeningsresultat {
        if (!soknad.erNorskBorger) {
            return ikkeOppfylt("Søker er ikke norsk borger")
        }

        val referansemaneder = soknad.referansemaneder(REFERANSEPERIODE_MANEDER)
        val tellendeInntekter =
            soknad.inntekter
                .filter { it.type != InntektsType.STIPEND_LANEKASSEN }
                .filter { it.belop.kroner > 0 }
                .filter { it.maned in referansemaneder }

        val manederMedInntekt = tellendeInntekter.map { it.maned }.toSet().size

        if (manederMedInntekt < KREVDE_INNTEKTSMANEDER) {
            return ikkeOppfylt(
                "Søker har inntekt i $manederMedInntekt av $KREVDE_INNTEKTSMANEDER påkrevde måneder",
            )
        }

        val samletInntekt = tellendeInntekter.sumOf { it.belop.kroner }
        if (samletInntekt < MINSTEINNTEKT) {
            return ikkeOppfylt(
                "Tellende inntekt er $samletInntekt kr og under minstegrensen på $MINSTEINNTEKT kr",
            )
        }

        return Opptjeningsresultat(
            oppfylt = true,
            regelresultat =
                Regelresultat(
                    regel = Regelnavn.OPPTJENING,
                    status = RegelStatus.OPPFYLT,
                    begrunnelse =
                        "Søker har $manederMedInntekt tellende inntektsmåneder og $samletInntekt kr i tellende inntekt",
                ),
        )
    }

    private fun ikkeOppfylt(begrunnelse: String) =
        Opptjeningsresultat(
            oppfylt = false,
            regelresultat =
                Regelresultat(
                    regel = Regelnavn.OPPTJENING,
                    status = RegelStatus.IKKE_OPPFYLT,
                    begrunnelse = begrunnelse,
                ),
        )

    private fun Soknad.referansemaneder(antall: Long): Set<YearMonth> {
        val sisteHeleManed = YearMonth.from(innsendt).minusMonths(1)
        return (0 until antall).map { sisteHeleManed.minusMonths(it) }.toSet()
    }
}
