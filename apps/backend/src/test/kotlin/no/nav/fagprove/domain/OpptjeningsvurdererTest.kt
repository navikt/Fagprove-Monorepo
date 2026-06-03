package no.nav.fagprove.domain

import java.time.YearMonth
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class OpptjeningsvurdererTest {
    @Test
    fun `should approve when citizen has six income months and income above half G`() {
        val resultat = Opptjeningsvurderer.vurder(testSoknad())

        assertTrue(resultat.oppfylt)
        assertEquals(RegelStatus.OPPFYLT, resultat.regelresultat.status)
    }

    @Test
    fun `should reject when applicant is not Norwegian citizen`() {
        val resultat = Opptjeningsvurderer.vurder(testSoknad(erNorskBorger = false))

        assertFalse(resultat.oppfylt)
        assertEquals(RegelStatus.IKKE_OPPFYLT, resultat.regelresultat.status)
    }

    @Test
    fun `should reject when applicant has fewer than six income months`() {
        val resultat =
            Opptjeningsvurderer.vurder(
                testSoknad(inntekter = seksTellendeInntekter().take(5)),
            )

        assertFalse(resultat.oppfylt)
    }

    @Test
    fun `should reject when income is below half G`() {
        val resultat =
            Opptjeningsvurderer.vurder(
                testSoknad(inntekter = seksTellendeInntekter(kroner = 10_000)),
            )

        assertFalse(resultat.oppfylt)
    }

    @Test
    fun `should ignore Lanekassen stipend income`() {
        val inntekter =
            listOf(
                testInntekt(YearMonth.of(2026, 5), type = InntektsType.STIPEND_LANEKASSEN),
                testInntekt(YearMonth.of(2026, 4), type = InntektsType.STIPEND_LANEKASSEN),
            ) + seksTellendeInntekter().take(5)

        val resultat = Opptjeningsvurderer.vurder(testSoknad(inntekter = inntekter))

        assertFalse(resultat.oppfylt)
    }
}
