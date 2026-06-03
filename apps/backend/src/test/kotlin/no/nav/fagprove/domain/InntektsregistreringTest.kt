package no.nav.fagprove.domain

import java.time.YearMonth
import kotlin.test.Test
import kotlin.test.assertEquals

class InntektsregistreringTest {
    @Test
    fun `should create valid Inntektsregistrering`() {
        val registrering =
            Inntektsregistrering(
                maned = YearMonth.of(2024, 3),
                type = InntektsType.ARBEID,
                belop = Penger(45000),
            )

        assertEquals(YearMonth.of(2024, 3), registrering.maned)
        assertEquals(InntektsType.ARBEID, registrering.type)
        assertEquals(Penger(45000), registrering.belop)
    }

    @Test
    fun `should support all InntektsType values`() {
        val typer = InntektsType.entries
        assertEquals(8, typer.size)

        typer.forEach { type ->
            val registrering =
                Inntektsregistrering(
                    maned = YearMonth.of(2024, 1),
                    type = type,
                    belop = Penger(10000),
                )
            assertEquals(type, registrering.type)
        }
    }

    @Test
    fun `equal values should be equal`() {
        val a =
            Inntektsregistrering(
                maned = YearMonth.of(2024, 5),
                type = InntektsType.SYKEPENGER,
                belop = Penger(30000),
            )
        val b =
            Inntektsregistrering(
                maned = YearMonth.of(2024, 5),
                type = InntektsType.SYKEPENGER,
                belop = Penger(30000),
            )
        assertEquals(a, b)
    }
}
