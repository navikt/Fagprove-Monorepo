package no.nav.fagprove.domain

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals

class KvoterTest {
    @Test
    fun `kan opprette kvoter med tre perioder`() {
        val kvoter =
            Kvoter(
                modrekvote =
                    Periode(
                        fra = LocalDate.of(2025, 6, 1),
                        til = LocalDate.of(2025, 9, 30),
                    ),
                fedrekvote =
                    Periode(
                        fra = LocalDate.of(2025, 10, 1),
                        til = LocalDate.of(2026, 1, 31),
                    ),
                fellesperiode =
                    Periode(
                        fra = LocalDate.of(2026, 2, 1),
                        til = LocalDate.of(2026, 5, 31),
                    ),
            )
        assertEquals(LocalDate.of(2025, 6, 1), kvoter.modrekvote.fra)
        assertEquals(LocalDate.of(2026, 1, 31), kvoter.fedrekvote.til)
        assertEquals(LocalDate.of(2026, 5, 31), kvoter.fellesperiode.til)
    }
}
