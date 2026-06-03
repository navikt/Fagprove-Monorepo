package no.nav.fagprove.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class BeregningsgrunnlagBeregnerTest {
    @Test
    fun `should calculate annual income from last three months`() {
        val resultat = BeregningsgrunnlagBeregner.beregn(testSoknad())

        val grunnlag = assertIs<Grunnlag.OK>(resultat.grunnlag)
        assertEquals(Penger(600_000), grunnlag.belop)
    }

    @Test
    fun `should cap calculation basis at six G`() {
        val resultat =
            BeregningsgrunnlagBeregner.beregn(
                testSoknad(
                    inntekter = inntekterSisteTreManeder(kroner = 70_000),
                    oppgittAarsinntekt = Penger(840_000),
                ),
            )

        val grunnlag = assertIs<Grunnlag.OK>(resultat.grunnlag)
        assertEquals(Penger(780_960), grunnlag.belop)
        assertEquals(Penger(840_000), grunnlag.beregnetAarsinntekt)
    }

    @Test
    fun `should return manual review when deviation is above twenty five percent`() {
        val resultat =
            BeregningsgrunnlagBeregner.beregn(
                testSoknad(oppgittAarsinntekt = Penger(400_000)),
            )

        assertIs<Grunnlag.ManuellVurdering>(resultat.grunnlag)
        assertEquals(RegelStatus.MANUELL_VURDERING, resultat.regelresultat.status)
    }

    @Test
    fun `should accept deviation exactly at twenty five percent`() {
        val resultat =
            BeregningsgrunnlagBeregner.beregn(
                testSoknad(oppgittAarsinntekt = Penger(480_000)),
            )

        assertIs<Grunnlag.OK>(resultat.grunnlag)
    }

    @Test
    fun `should skip deviation check when stated annual income is zero`() {
        val resultat =
            BeregningsgrunnlagBeregner.beregn(
                testSoknad(oppgittAarsinntekt = Penger(0)),
            )

        val grunnlag = assertIs<Grunnlag.OK>(resultat.grunnlag)
        assertEquals(Penger(600_000), grunnlag.belop)
        assertTrue(resultat.regelresultat.begrunnelse.isNotBlank())
    }
}
