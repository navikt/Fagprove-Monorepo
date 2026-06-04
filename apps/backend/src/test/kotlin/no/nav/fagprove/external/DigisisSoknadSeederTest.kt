package no.nav.fagprove.external

import no.nav.fagprove.domain.Saksbehandling
import no.nav.fagprove.domain.Vedtak
import no.nav.fagprove.repository.SoknadRepository
import no.nav.fagprove.repository.repositoryTestDatabase
import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotNull

class DigisisSoknadSeederTest {
    @Test
    fun `seeder lagrer hentede Digisis-soknader`() {
        val repository = SoknadRepository(repositoryTestDatabase())
        val seeder =
            DigisisSoknadSeeder(
                soknadRepository = repository,
                digisisSoknadClient =
                    FakeDigisisSoknadClient(
                        listOf(
                            digisisSoknad(id = "fp-001", beskrivelse = "Forste scenario"),
                            digisisSoknad(id = "fp-002", beskrivelse = "Andre scenario", fnr = "12345678902"),
                        ),
                    ),
            )

        val seededeSoknader = seeder.seed()

        assertContentEquals(
            listOf(
                deterministicDigisisSoknadId("fp-001"),
                deterministicDigisisSoknadId("fp-002"),
            ),
            seededeSoknader.map { it.id },
        )
        assertEquals(2, repository.hentAlle().size)
        assertEquals("Forste scenario", repository.hent(deterministicDigisisSoknadId("fp-001"))?.beskrivelse)
    }

    @Test
    fun `seeder er idempotent ved gjentatt synkronisering`() {
        val repository = SoknadRepository(repositoryTestDatabase())
        val seeder =
            DigisisSoknadSeeder(
                soknadRepository = repository,
                digisisSoknadClient = FakeDigisisSoknadClient(listOf(digisisSoknad(id = "fp-001"))),
            )

        seeder.seed()
        seeder.seed()

        assertEquals(1, repository.hentAlle().size)
    }

    @Test
    fun `seedede Digisis-soknader kan behandles`() {
        val repository = SoknadRepository(repositoryTestDatabase())
        DigisisSoknadSeeder(
            soknadRepository = repository,
            digisisSoknadClient = FakeDigisisSoknadClient(listOf(digisisSoknad(id = "fp-001"))),
        ).seed()

        val soknad = assertNotNull(repository.hent(deterministicDigisisSoknadId("fp-001")))
        val resultat = Saksbehandling.behandle(soknad)

        assertIs<Vedtak.Innvilget>(resultat.vedtak)
    }
}

private class FakeDigisisSoknadClient(
    private val soknader: List<DigisisSoknadDto>,
) : DigisisSoknadClient {
    override fun hentSoknader(): List<DigisisSoknadDto> = soknader
}
