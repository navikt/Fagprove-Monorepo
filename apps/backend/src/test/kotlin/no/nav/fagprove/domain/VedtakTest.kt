package no.nav.fagprove.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class VedtakTest {
    @Test
    fun `innvilget vedtak har belop`() {
        val vedtak: Vedtak = Vedtak.Innvilget(belop = Penger(50000))
        assertIs<Vedtak.Innvilget>(vedtak)
        assertEquals(Penger(50000), vedtak.belop)
    }

    @Test
    fun `avslag vedtak har begrunnelse`() {
        val vedtak: Vedtak = Vedtak.Avslag(begrunnelse = "Ikke oppfylt opptjeningstid")
        assertIs<Vedtak.Avslag>(vedtak)
        assertEquals("Ikke oppfylt opptjeningstid", vedtak.begrunnelse)
    }

    @Test
    fun `engangsstonad vedtak har belop`() {
        val vedtak: Vedtak = Vedtak.Engangsstonad(belop = Penger(92648))
        assertIs<Vedtak.Engangsstonad>(vedtak)
        assertEquals(Penger(92648), vedtak.belop)
    }

    @Test
    fun `manuell vurdering vedtak har grunn`() {
        val vedtak: Vedtak = Vedtak.ManuellVurdering(grunn = "Behøver manuell gjennomgang")
        assertIs<Vedtak.ManuellVurdering>(vedtak)
        assertEquals("Behøver manuell gjennomgang", vedtak.grunn)
    }

    @Test
    fun `kan bruke when-uttrykk over alle varianter`() {
        val vedtak: Vedtak = Vedtak.Innvilget(belop = Penger(30000))
        val beskrivelse =
            when (vedtak) {
                is Vedtak.Innvilget -> "Innvilget: ${vedtak.belop.kroner} kr"
                is Vedtak.Avslag -> "Avslått: ${vedtak.begrunnelse}"
                is Vedtak.Engangsstonad -> "Engangsstønad: ${vedtak.belop.kroner} kr"
                is Vedtak.ManuellVurdering -> "Manuell: ${vedtak.grunn}"
            }
        assertEquals("Innvilget: 30000 kr", beskrivelse)
    }
}
