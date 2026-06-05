package no.nav.fagprove.domain

import java.time.YearMonth
import kotlin.math.abs

data class BeregningsgrunnlagResultat(
    val grunnlag: Grunnlag,
    val regelresultat: Regelresultat,
)

object BeregningsgrunnlagBeregner {
    private const val SEKS_G = 780_960
    private const val BEREGNINGSPERIODE_MANEDER = 3

    fun avgrensTilMaksYtelse(aarsinntekt: Penger): Penger = Penger(minOf(aarsinntekt.kroner, SEKS_G))

    fun beregn(soknad: Soknad): BeregningsgrunnlagResultat {
        val beregningsmaneder = soknad.sisteHeleManeder(BEREGNINGSPERIODE_MANEDER)
        val inntektPerManed =
            beregningsmaneder.map { maned ->
                soknad.inntekter
                    .filter { it.type in InntektsType.GODKJENTE }
                    .filter { it.maned == maned }
                    .sumOf { it.belop.kroner }
            }

        val beregnetAarsinntekt = (inntektPerManed.sum() * 12) / inntektPerManed.size
        val oppgittAarsinntekt = soknad.oppgittAarsinntekt.kroner

        if (oppgittAarsinntekt > 0 && harAvvikOverTjuefemProsent(beregnetAarsinntekt, oppgittAarsinntekt)) {
            val grunn =
                "Beregnet årsinntekt $beregnetAarsinntekt kr avviker mer enn 25 % fra oppgitt årsinntekt $oppgittAarsinntekt kr"
            return BeregningsgrunnlagResultat(
                grunnlag = Grunnlag.ManuellVurdering(grunn),
                regelresultat =
                    Regelresultat(
                        regel = Regelnavn.BEREGNINGSGRUNNLAG,
                        status = RegelStatus.MANUELL_VURDERING,
                        begrunnelse = grunn,
                    ),
            )
        }

        val endeligBelop = avgrensTilMaksYtelse(Penger(beregnetAarsinntekt)).kroner
        return BeregningsgrunnlagResultat(
            grunnlag =
                Grunnlag.OK(
                    belop = Penger(endeligBelop),
                    beregnetAarsinntekt = Penger(beregnetAarsinntekt),
                ),
            regelresultat =
                Regelresultat(
                    regel = Regelnavn.BEREGNINGSGRUNNLAG,
                    status = RegelStatus.OPPFYLT,
                    begrunnelse = "Beregningsgrunnlag er $endeligBelop kr",
                ),
        )
    }

    private fun harAvvikOverTjuefemProsent(
        beregnetAarsinntekt: Int,
        oppgittAarsinntekt: Int,
    ): Boolean = abs(beregnetAarsinntekt - oppgittAarsinntekt).toLong() * 100 > oppgittAarsinntekt.toLong() * 25

    private fun Soknad.sisteHeleManeder(antall: Int): List<YearMonth> {
        val permisjonsstart = termindato.minusWeeks(3)
        val sisteHeleManed = YearMonth.from(permisjonsstart).minusMonths(1)
        return (antall - 1 downTo 0).map { sisteHeleManed.minusMonths(it.toLong()) }
    }
}
