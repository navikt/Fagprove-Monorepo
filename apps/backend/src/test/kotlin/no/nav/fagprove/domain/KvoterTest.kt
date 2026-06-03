package no.nav.fagprove.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class KvoterTest {
    @Test
    fun `should create Kvoter when weeks sum to total`() {
        val kvoter =
            Kvoter(
                modrekvote = Uker(15),
                fedrekvote = Uker(15),
                fellesperiode = Uker(16),
                bonusuker = Uker(0),
                forskuddUker = Uker(3),
                total = Uker(49),
            )
        assertEquals(Uker(15), kvoter.modrekvote)
        assertEquals(Uker(16), kvoter.fellesperiode)
        assertEquals(Uker(49), kvoter.total)
    }

    @Test
    fun `should reject Kvoter when weeks do not sum to total`() {
        assertFailsWith<IllegalArgumentException> {
            Kvoter(
                modrekvote = Uker(15),
                fedrekvote = Uker(15),
                fellesperiode = Uker(15),
                bonusuker = Uker(0),
                forskuddUker = Uker(3),
                total = Uker(49),
            )
        }
    }
}
