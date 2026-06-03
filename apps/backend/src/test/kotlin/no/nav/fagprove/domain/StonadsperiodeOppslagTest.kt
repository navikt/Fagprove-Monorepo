package no.nav.fagprove.domain

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals

class StonadsperiodeOppslagTest {
    @Test
    fun `should find forty nine weeks for one child with hundred percent coverage`() {
        val resultat = StonadsperiodeOppslag.finn(testSoknad())

        assertEquals(Uker(49), resultat.stonadsperiode.totalUker)
        assertEquals(LocalDate.of(2026, 7, 11), resultat.stonadsperiode.periode.fra)
    }

    @Test
    fun `should find fifty nine weeks for one child with eighty percent coverage`() {
        val resultat =
            StonadsperiodeOppslag.finn(
                testSoknad(dekningsgrad = Dekningsgrad.ATTI_PROSENT),
            )

        assertEquals(Uker(59), resultat.stonadsperiode.totalUker)
    }

    @Test
    fun `should add twin weeks`() {
        val resultat = StonadsperiodeOppslag.finn(testSoknad(antallBarn = 2))

        assertEquals(Uker(66), resultat.stonadsperiode.totalUker)
    }

    @Test
    fun `should use three or more children addition`() {
        val resultat =
            StonadsperiodeOppslag.finn(
                testSoknad(antallBarn = 4, dekningsgrad = Dekningsgrad.ATTI_PROSENT),
            )

        assertEquals(Uker(115), resultat.stonadsperiode.totalUker)
    }
}
