package no.nav.fagprove.external

import kotlinx.serialization.SerializationException
import kotlinx.serialization.decodeFromString
import no.nav.fagprove.domain.Dekningsgrad
import no.nav.fagprove.domain.InntektsType
import no.nav.fagprove.domain.Penger
import no.nav.fagprove.domain.Rettsforhold
import java.time.LocalDate
import java.time.YearMonth
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class DigisisSoknadMapperTest {
    @Test
    fun `mapper alle rettsforhold-varianter`() {
        val variants =
            mapOf(
                "begge" to Rettsforhold.BEGGE_FORELDRE,
                "kun-mor" to Rettsforhold.KUN_MOR,
                "kun-far" to Rettsforhold.KUN_FAR,
            )

        variants.forEach { (externalValue, expected) ->
            val soknad = digisisSoknad(rettsforhold = externalValue).toSoknad()

            assertEquals(expected, soknad.rettsforhold)
        }
    }

    @Test
    fun `mapper begge dekningsgrad-varianter`() {
        val variants =
            mapOf(
                100 to Dekningsgrad.HUNDRE_PROSENT,
                80 to Dekningsgrad.ATTI_PROSENT,
            )

        variants.forEach { (externalValue, expected) ->
            val soknad = digisisSoknad(dekningsgrad = externalValue).toSoknad()

            assertEquals(expected, soknad.dekningsgrad)
        }
    }

    @Test
    fun `mapper inntektshistorikk med maaned type og beloep`() {
        val soknad =
            digisisSoknad(
                inntektshistorikk =
                    listOf(
                        DigisisInntektDto(
                            maned = "2026-05",
                            type = "STIPEND_LANEKASSEN",
                            belop = 12_345,
                        ),
                    ),
            ).toSoknad()

        assertEquals(YearMonth.of(2026, 5), soknad.inntekter.single().maned)
        assertEquals(InntektsType.STIPEND_LANEKASSEN, soknad.inntekter.single().type)
        assertEquals(Penger(12_345), soknad.inntekter.single().belop)
    }

    @Test
    fun `mapper Digisis-id deterministisk til UUID`() {
        val forste = digisisSoknad(id = "fp-001-happy-path").toSoknad()
        val andre = digisisSoknad(id = "fp-001-happy-path").toSoknad()

        assertEquals(deterministicDigisisSoknadId("fp-001-happy-path"), forste.id)
        assertEquals(forste.id, andre.id)
    }

    @Test
    fun `mapper datoer og beskrivelse`() {
        val soknad =
            digisisSoknad(
                beskrivelse = "  Happy path  ",
                termindato = "2026-08-15",
            ).toSoknad()

        assertEquals(LocalDate.of(2026, 8, 15), soknad.termindato)
        assertEquals(LocalDate.of(2026, 6, 15), soknad.innsendt)
        assertEquals("Happy path", soknad.beskrivelse)
    }

    @Test
    fun `avviser ugyldig fnr uten aa eksponere verdien`() {
        val error =
            assertFailsWith<DigisisSoknadMappingException> {
                digisisSoknad(fnr = "123").toSoknad()
            }

        assertEquals("fnr må være 11 siffer", error.message)
    }

    @Test
    fun `deserialisering feiler for ugyldig JSON-shape`() {
        assertFailsWith<SerializationException> {
            digisisJson.decodeFromString<List<DigisisSoknadDto>>(
                """[{"id":1}]""",
            )
        }
    }
}

internal fun digisisSoknad(
    id: String = "fp-001-happy-path",
    beskrivelse: String = "Happy path",
    fnr: String = "12345678901",
    erNorskBorger: Boolean = true,
    termindato: String = "2026-08-15",
    oppgittArsinntekt: Int = 600_000,
    inntektshistorikk: List<DigisisInntektDto> = validDigisisInntektshistorikk(),
    antallBarn: Int = 1,
    rettsforhold: String = "begge",
    dekningsgrad: Int = 100,
) = DigisisSoknadDto(
    id = id,
    beskrivelse = beskrivelse,
    fnr = fnr,
    erNorskBorger = erNorskBorger,
    termindato = termindato,
    oppgittArsinntekt = oppgittArsinntekt,
    inntektshistorikk = inntektshistorikk,
    antallBarn = antallBarn,
    rettsforhold = rettsforhold,
    dekningsgrad = dekningsgrad,
)

internal fun validDigisisInntektshistorikk(): List<DigisisInntektDto> =
    listOf(
        DigisisInntektDto("2025-12", "ARBEID", 50_000),
        DigisisInntektDto("2026-01", "ARBEID", 50_000),
        DigisisInntektDto("2026-02", "ARBEID", 50_000),
        DigisisInntektDto("2026-03", "ARBEID", 50_000),
        DigisisInntektDto("2026-04", "ARBEID", 50_000),
        DigisisInntektDto("2026-05", "ARBEID", 50_000),
    )
