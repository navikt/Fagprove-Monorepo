package no.nav.fagprove.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PengerTest {
    @Test
    fun `should create Penger with valid amount`() {
        val penger = Penger(kroner = 5000)
        assertEquals(5000, penger.kroner)
    }

    @Test
    fun `should allow zero kroner`() {
        val penger = Penger(kroner = 0)
        assertEquals(0, penger.kroner)
    }

    @Test
    fun `should reject negative kroner`() {
        assertFailsWith<IllegalArgumentException> {
            Penger(kroner = -1)
        }
    }

    @Test
    fun `equal values should be equal`() {
        assertEquals(Penger(100), Penger(100))
    }
}
