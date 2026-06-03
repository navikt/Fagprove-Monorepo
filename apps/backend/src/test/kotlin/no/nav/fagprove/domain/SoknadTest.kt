package no.nav.fagprove.domain

import java.time.LocalDate
import java.time.YearMonth
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class SoknadTest {
    private fun lagInntekter(antall: Int) =
        (1..antall).map {
            Inntektsregistrering(
                maned = YearMonth.of(2025, it.coerceAtMost(12)),
                type = InntektsType.ARBEID,
                belop = Penger(30000),
            )
        }

    @Test
    fun `kan opprette en gyldig soknad`() {
        val soknad =
            Soknad(
                fnr = "12345678901",
                erNorskBorger = true,
                inntekter = lagInntekter(6),
                stonadsperiode =
                    Periode(
                        fra = LocalDate.of(2025, 6, 1),
                        til = LocalDate.of(2025, 12, 31),
                    ),
                innsendt = LocalDate.of(2025, 5, 15),
            )
        assertEquals("12345678901", soknad.fnr)
        assertEquals(true, soknad.erNorskBorger)
        assertEquals(6, soknad.inntekter.size)
    }

    @Test
    fun `fnr med feil lengde kaster exception`() {
        assertFailsWith<IllegalArgumentException> {
            Soknad(
                fnr = "123",
                erNorskBorger = true,
                inntekter = emptyList(),
                stonadsperiode =
                    Periode(
                        fra = LocalDate.of(2025, 6, 1),
                        til = LocalDate.of(2025, 12, 31),
                    ),
                innsendt = LocalDate.of(2025, 5, 15),
            )
        }
    }

    @Test
    fun `fnr med bokstaver kaster exception`() {
        assertFailsWith<IllegalArgumentException> {
            Soknad(
                fnr = "1234567890a",
                erNorskBorger = true,
                inntekter = emptyList(),
                stonadsperiode =
                    Periode(
                        fra = LocalDate.of(2025, 6, 1),
                        til = LocalDate.of(2025, 12, 31),
                    ),
                innsendt = LocalDate.of(2025, 5, 15),
            )
        }
    }
}
