package no.nav.fagprove.domain

import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertIs

class SaksbehandlingTest {
    @Test
    fun `should innvilge when all rules pass`() {
        val resultat = Saksbehandling.behandle(testSoknad())

        val vedtak = assertIs<Vedtak.Innvilget>(resultat.vedtak)
        assertEquals(Penger(600_000), vedtak.belop)
        assertEquals(Uker(49), vedtak.stonadsperiode.totalUker)
        assertContentEquals(
            listOf(
                Regelnavn.OPPTJENING,
                Regelnavn.BEREGNINGSGRUNNLAG,
                Regelnavn.STONADSPERIODE,
                Regelnavn.KVOTEFORDELING,
            ),
            resultat.regelspor.map { it.regel },
        )
    }

    @Test
    fun `should stop at manual review when calculation basis deviation is too high`() {
        val resultat =
            Saksbehandling.behandle(
                testSoknad(oppgittAarsinntekt = Penger(400_000)),
            )

        assertIs<Vedtak.ManuellVurdering>(resultat.vedtak)
        assertContentEquals(
            listOf(Regelnavn.OPPTJENING, Regelnavn.BEREGNINGSGRUNNLAG),
            resultat.regelspor.map { it.regel },
        )
    }

    @Test
    fun `should stop with engangsstonad when opptjening fails for Norwegian citizen`() {
        val resultat =
            Saksbehandling.behandle(
                testSoknad(inntekter = seksTellendeInntekter().take(5)),
            )

        val vedtak = assertIs<Vedtak.Engangsstonad>(resultat.vedtak)
        assertEquals(Penger(92_648), vedtak.belop)
        assertContentEquals(
            listOf(Regelnavn.OPPTJENING, Regelnavn.ENGANGSSTONAD),
            resultat.regelspor.map { it.regel },
        )
    }

    @Test
    fun `should stop with avslag when applicant is not Norwegian citizen`() {
        val resultat =
            Saksbehandling.behandle(
                testSoknad(erNorskBorger = false),
            )

        assertIs<Vedtak.Avslag>(resultat.vedtak)
        assertContentEquals(
            listOf(Regelnavn.OPPTJENING, Regelnavn.ENGANGSSTONAD),
            resultat.regelspor.map { it.regel },
        )
    }

    @Test
    fun `manual innvilgelse should cap oppgitt income at 6G`() {
        val vedtak =
            Saksbehandling.besluttManuelt(
                soknad = testSoknad(oppgittAarsinntekt = Penger(900_000)),
                beslutning = ManuellBeslutning.INNVILGELSE,
                begrunnelse = "Saksbehandler godkjenner inntektsgrunnlaget",
            )

        val innvilget = assertIs<Vedtak.Innvilget>(vedtak)
        assertEquals(Penger(780_960), innvilget.belop)
        assertEquals("Saksbehandler godkjenner inntektsgrunnlaget", innvilget.begrunnelse)
    }
}
