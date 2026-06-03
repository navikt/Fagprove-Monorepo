package no.nav.fagprove.seed

import no.nav.fagprove.domain.Penger
import no.nav.fagprove.domain.Regelnavn
import no.nav.fagprove.domain.Saksbehandling
import no.nav.fagprove.domain.Uker
import no.nav.fagprove.domain.Vedtak
import no.nav.fagprove.repository.SoknadRepository
import no.nav.fagprove.repository.repositoryTestDatabase
import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotNull

class TestSoknadSeederTest {
    @Test
    fun `seeder lagrer fem deterministiske soknader idempotent`() {
        val repository = SoknadRepository(repositoryTestDatabase())
        val seeder = TestSoknadSeeder(repository)

        seeder.seed()
        seeder.seed()

        val alleSoknader = repository.hentAlle()
        assertEquals(5, alleSoknader.size)
        assertContentEquals(
            TestSoknader.alle.map { it.id },
            alleSoknader.map { it.id },
        )
    }

    @Test
    fun `seedede soknader dekker alle vedtaksvarianter`() {
        val repository = SoknadRepository(repositoryTestDatabase())
        TestSoknadSeeder(repository).seed()

        val innvilget = Saksbehandling.behandle(repository.hentSeed(TestSoknader.innvilgetId))
        val innvilgetVedtak = assertIs<Vedtak.Innvilget>(innvilget.vedtak)
        assertEquals(Penger(648_000), innvilgetVedtak.belop)
        assertEquals(Uker(49), innvilgetVedtak.stonadsperiode.totalUker)
        assertFullAutomatiskRegelspor(innvilget.regelspor.map { it.regel })

        val avslag = Saksbehandling.behandle(repository.hentSeed(TestSoknader.avslagId))
        assertIs<Vedtak.Avslag>(avslag.vedtak)
        assertContentEquals(
            listOf(Regelnavn.OPPTJENING, Regelnavn.ENGANGSSTONAD),
            avslag.regelspor.map { it.regel },
        )

        val engangsstonad = Saksbehandling.behandle(repository.hentSeed(TestSoknader.engangsstonadId))
        val engangsstonadVedtak = assertIs<Vedtak.Engangsstonad>(engangsstonad.vedtak)
        assertEquals(Penger(92_648), engangsstonadVedtak.belop)
        assertContentEquals(
            listOf(Regelnavn.OPPTJENING, Regelnavn.ENGANGSSTONAD),
            engangsstonad.regelspor.map { it.regel },
        )

        val manuellVurdering = Saksbehandling.behandle(repository.hentSeed(TestSoknader.manuellVurderingId))
        assertIs<Vedtak.ManuellVurdering>(manuellVurdering.vedtak)
        assertContentEquals(
            listOf(Regelnavn.OPPTJENING, Regelnavn.BEREGNINGSGRUNNLAG),
            manuellVurdering.regelspor.map { it.regel },
        )

        val grensefall =
            Saksbehandling.behandle(repository.hentSeed(TestSoknader.grensefallTjuefemProsentAvvikId))
        val grensefallVedtak = assertIs<Vedtak.Innvilget>(grensefall.vedtak)
        assertEquals(Penger(600_000), grensefallVedtak.belop)
        assertFullAutomatiskRegelspor(grensefall.regelspor.map { it.regel })
    }

    private fun SoknadRepository.hentSeed(id: java.util.UUID) = assertNotNull(hent(id))

    private fun assertFullAutomatiskRegelspor(regelspor: List<Regelnavn>) {
        assertContentEquals(
            listOf(
                Regelnavn.OPPTJENING,
                Regelnavn.BEREGNINGSGRUNNLAG,
                Regelnavn.STONADSPERIODE,
                Regelnavn.KVOTEFORDELING,
            ),
            regelspor,
        )
    }
}
