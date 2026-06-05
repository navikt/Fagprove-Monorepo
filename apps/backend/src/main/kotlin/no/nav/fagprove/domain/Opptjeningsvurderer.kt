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
                .filter { it.type in InntektsType.GODKJENTE }
                .filter { it.belop.kroner > 0 }
                .filter { it.maned in referansemaneder }

        val manederMedInntekt = tellendeInntekter.map { it.maned }.toSet().size

        if (manederMedInntekt < KREVDE_INNTEKTSMANEDER) {
            return ikkeOppfylt(
                "Søker har inntekt i $manederMedInntekt av $KREVDE_INNTEKTSMANEDER påkrevde måneder",
            )
        }

        val samletInntekt = tellendeInntekter.sumOf { it.belop.kroner }
        val arsinntekt = samletInntekt.toLong() * 12 / REFERANSEPERIODE_MANEDER
        if (arsinntekt < MINSTEINNTEKT) {
            return ikkeOppfylt(
                "Omregnet årsinntekt er $arsinntekt kr og under minstegrensen på $MINSTEINNTEKT kr (½G)",
            )
        }

        return Opptjeningsresultat(
            oppfylt = true,
            regelresultat =
                Regelresultat(
                    regel = Regelnavn.OPPTJENING,
                    status = RegelStatus.OPPFYLT,
                    begrunnelse =
                        "Søker har $manederMedInntekt tellende inntektsmåneder og $arsinntekt kr i omregnet årsinntekt",
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
        val sisteManed = YearMonth.from(termindato).minusMonths(1)
        return (0 until antall).map { sisteManed.minusMonths(it) }.toSet()
    }
}
