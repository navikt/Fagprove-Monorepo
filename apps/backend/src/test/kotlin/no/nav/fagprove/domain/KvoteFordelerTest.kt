package no.nav.fagprove.domain

import kotlin.test.Test
import kotlin.test.assertEquals

class KvoteFordelerTest {
    @Test
    fun `should distribute quotas for both parents with one child and hundred percent coverage`() {
        val soknad = testSoknad()
        val stonadsperiode = StonadsperiodeOppslag.finn(soknad).stonadsperiode

        val resultat = KvoteFordeler.fordel(soknad, stonadsperiode)

        assertEquals(Uker(15), resultat.kvoter.modrekvote)
        assertEquals(Uker(15), resultat.kvoter.fedrekvote)
        assertEquals(Uker(16), resultat.kvoter.fellesperiode)
        assertEquals(Uker(3), resultat.kvoter.forskuddUker)
        assertEquals(Uker(49), resultat.kvoter.total)
    }

    @Test
    fun `should distribute quotas for eighty percent coverage`() {
        val soknad = testSoknad(dekningsgrad = Dekningsgrad.ATTI_PROSENT)
        val stonadsperiode = StonadsperiodeOppslag.finn(soknad).stonadsperiode

        val resultat = KvoteFordeler.fordel(soknad, stonadsperiode)

        assertEquals(Uker(19), resultat.kvoter.modrekvote)
        assertEquals(Uker(19), resultat.kvoter.fedrekvote)
        assertEquals(Uker(18), resultat.kvoter.fellesperiode)
        assertEquals(Uker(59), resultat.kvoter.total)
    }

    @Test
    fun `should keep bonus weeks separate for twins`() {
        val soknad = testSoknad(antallBarn = 2)
        val stonadsperiode = StonadsperiodeOppslag.finn(soknad).stonadsperiode

        val resultat = KvoteFordeler.fordel(soknad, stonadsperiode)

        assertEquals(Uker(17), resultat.kvoter.bonusuker)
        assertEquals(Uker(66), resultat.kvoter.total)
    }

    @Test
    fun `should give no father quota when only mother has right`() {
        val soknad = testSoknad(rettsforhold = Rettsforhold.KUN_MOR)
        val stonadsperiode = StonadsperiodeOppslag.finn(soknad).stonadsperiode

        val resultat = KvoteFordeler.fordel(soknad, stonadsperiode)

        assertEquals(Uker(15), resultat.kvoter.modrekvote)
        assertEquals(Uker(0), resultat.kvoter.fedrekvote)
        assertEquals(Uker(31), resultat.kvoter.fellesperiode)
    }

    @Test
    fun `should give no mother or advance quota when only father has right`() {
        val soknad = testSoknad(rettsforhold = Rettsforhold.KUN_FAR)
        val stonadsperiode = StonadsperiodeOppslag.finn(soknad).stonadsperiode

        val resultat = KvoteFordeler.fordel(soknad, stonadsperiode)

        assertEquals(Uker(0), resultat.kvoter.modrekvote)
        assertEquals(Uker(15), resultat.kvoter.fedrekvote)
        assertEquals(Uker(34), resultat.kvoter.fellesperiode)
        assertEquals(Uker(0), resultat.kvoter.forskuddUker)
    }
}
