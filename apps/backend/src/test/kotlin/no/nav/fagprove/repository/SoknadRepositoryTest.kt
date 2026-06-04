package no.nav.fagprove.repository

import no.nav.fagprove.domain.InntektsType
import no.nav.fagprove.domain.Penger
import no.nav.fagprove.domain.testInntekt
import no.nav.fagprove.domain.testSoknad
import java.time.YearMonth
import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class SoknadRepositoryTest {
    @Test
    fun `lagrer og henter soknad med inntektshistorikk`() {
        val database = repositoryTestDatabase()
        val repository = SoknadRepository(database)
        val inntekter =
            listOf(
                testInntekt(
                    maned = YearMonth.of(2026, 1),
                    kroner = 41_000,
                    type = InntektsType.ARBEID,
                ),
                testInntekt(
                    maned = YearMonth.of(2026, 2),
                    kroner = 39_500,
                    type = InntektsType.SYKEPENGER,
                ),
                testInntekt(
                    maned = YearMonth.of(2026, 3),
                    kroner = 42_000,
                    type = InntektsType.FORELDREPENGER,
                ),
            )
        val soknad =
            testSoknad(
                inntekter = inntekter,
                oppgittAarsinntekt = Penger(490_000),
            )

        repository.lagre(soknad)

        val hentet = assertNotNull(repository.hent(soknad.id))
        assertEquals(soknad, hentet)
    }

    @Test
    fun `lister soknader med batchlastet inntektshistorikk`() {
        val database = repositoryTestDatabase()
        val repository = SoknadRepository(database)
        val forste = testSoknad()
        val andre =
            testSoknad(
                inntekter =
                    listOf(
                        testInntekt(YearMonth.of(2026, 4), kroner = 38_000),
                        testInntekt(YearMonth.of(2026, 5), kroner = 39_000),
                    ),
                oppgittAarsinntekt = Penger(468_000),
            )
        repository.lagre(andre)
        repository.lagre(forste)

        val soknader = repository.hentAlle()

        assertEquals(2, soknader.size)
        assertContentEquals(
            forste.inntekter.sortedBy { it.maned },
            soknader.single { it.id == forste.id }.inntekter,
        )
        assertContentEquals(
            andre.inntekter.sortedBy { it.maned },
            soknader.single { it.id == andre.id }.inntekter,
        )
    }
}
