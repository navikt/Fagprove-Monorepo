package no.nav.fagprove.domain

import java.time.YearMonth
import kotlin.math.abs

data class BeregningsgrunnlagResultat(
    val grunnlag: Grunnlag,
    val regelresultat: Regelresultat,
)

object BeregningsgrunnlagBeregner {
    private const val SEKS_G = 780_960

    fun beregn(soknad: Soknad): BeregningsgrunnlagResultat {
        val sisteTreManeder = soknad.sisteHeleManeder(3)
        val inntektPerManed =
            sisteTreManeder.map { maned ->
                soknad.inntekter
                    .filter { it.type != InntektsType.STIPEND_LANEKASSEN }
                    .filter { it.maned == maned }
                    .sumOf { it.belop.kroner }
            }

        val beregnetAarsinntekt = (inntektPerManed.sum() / 3) * 12
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

        val endeligBelop = minOf(beregnetAarsinntekt, SEKS_G)
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
        val sisteHeleManed = YearMonth.from(innsendt).minusMonths(1)
        return (antall - 1 downTo 0).map { sisteHeleManed.minusMonths(it.toLong()) }
    }
}
