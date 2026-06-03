package no.nav.fagprove.domain

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PeriodeTest {
    @Test
    fun `should create Periode with valid dates`() {
        val fra = LocalDate.of(2024, 1, 1)
        val til = LocalDate.of(2024, 6, 30)
        val periode = Periode(fra = fra, til = til)

        assertEquals(fra, periode.fra)
        assertEquals(til, periode.til)
    }

    @Test
    fun `should allow same day for fra and til`() {
        val dato = LocalDate.of(2024, 3, 15)
        val periode = Periode(fra = dato, til = dato)

        assertEquals(dato, periode.fra)
        assertEquals(dato, periode.til)
    }

    @Test
    fun `should reject fra after til`() {
        assertFailsWith<IllegalArgumentException> {
            Periode(
                fra = LocalDate.of(2024, 6, 1),
                til = LocalDate.of(2024, 1, 1),
            )
        }
    }

    @Test
    fun `equal values should be equal`() {
        val fra = LocalDate.of(2024, 1, 1)
        val til = LocalDate.of(2024, 12, 31)
        assertEquals(Periode(fra, til), Periode(fra, til))
    }
}
