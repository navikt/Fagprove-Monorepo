package no.nav.fagprove.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class EngangsstonadFallbackTest {
    @Test
    fun `should return engangsstonad for Norwegian citizen`() {
        val resultat = EngangsstonadFallback.vurder(testSoknad(erNorskBorger = true))

        val vedtak = assertIs<Vedtak.Engangsstonad>(resultat.vedtak)
        assertEquals(Penger(92_648), vedtak.belop)
        assertEquals(Regelnavn.ENGANGSSTONAD, resultat.regelresultat.regel)
    }

    @Test
    fun `should return avslag when applicant is not Norwegian citizen`() {
        val resultat = EngangsstonadFallback.vurder(testSoknad(erNorskBorger = false))

        assertIs<Vedtak.Avslag>(resultat.vedtak)
        assertEquals(RegelStatus.IKKE_OPPFYLT, resultat.regelresultat.status)
    }
}
