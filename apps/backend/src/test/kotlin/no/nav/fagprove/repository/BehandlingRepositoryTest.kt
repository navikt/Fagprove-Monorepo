package no.nav.fagprove.repository

import no.nav.fagprove.domain.Penger
import no.nav.fagprove.domain.RegelStatus
import no.nav.fagprove.domain.Regelnavn
import no.nav.fagprove.domain.Regelresultat
import no.nav.fagprove.domain.Saksbehandlingsresultat
import no.nav.fagprove.domain.Vedtak
import no.nav.fagprove.domain.testSoknad
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import java.time.LocalDateTime
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull

class BehandlingRepositoryTest {
    @Test
    fun `oppretter behandling med regelspor i en transaksjon`() {
        val database = repositoryTestDatabase()
        val soknad = testSoknad()
        SoknadRepository(database).lagre(soknad)
        val repository = BehandlingRepository(database)
        val opprettetTidspunkt = LocalDateTime.of(2026, 6, 3, 10, 15, 0)
        val regelspor = testRegelspor()

        val behandling =
            repository.opprett(
                soknadId = soknad.id,
                regelspor = regelspor,
                opprettetTidspunkt = opprettetTidspunkt,
            )

        assertEquals(soknad.id, behandling.soknadId)
        assertEquals(BehandlingStatus.OPPRETTET, behandling.status)
        assertEquals(opprettetTidspunkt, behandling.opprettetTidspunkt)
        assertEquals(null, behandling.ferdigstiltTidspunkt)
        assertEquals(regelspor, behandling.regelspor)
        assertEquals(behandling, assertNotNull(repository.hent(behandling.id)))
    }

    @Test
    fun `henter behandling for soknad og avviser duplikat`() {
        val database = repositoryTestDatabase()
        val soknad = testSoknad()
        SoknadRepository(database).lagre(soknad)
        val repository = BehandlingRepository(database)
        val behandling =
            repository.opprett(
                soknadId = soknad.id,
                regelspor = testRegelspor(),
                opprettetTidspunkt = LocalDateTime.of(2026, 6, 3, 10, 15, 0),
            )

        assertEquals(behandling, assertNotNull(repository.hentForSoknad(soknad.id)))
        assertFailsWith<Exception> {
            repository.opprett(
                soknadId = soknad.id,
                regelspor = testRegelspor(),
                opprettetTidspunkt = LocalDateTime.of(2026, 6, 3, 10, 20, 0),
            )
        }
    }

    @Test
    fun `ruller tilbake behandling og regelspor naar vedtak ikke kan lagres`() {
        val database = repositoryTestDatabase()
        val soknad = testSoknad()
        SoknadRepository(database).lagre(soknad)
        val repository = BehandlingRepository(database)
        val resultat =
            Saksbehandlingsresultat(
                vedtak =
                    Vedtak.Engangsstonad(
                        belop = Penger(92_000),
                        begrunnelse = "Soker fyller vilkar for engangsstonad",
                    ),
                regelspor = testRegelspor(),
            )

        assertFailsWith<Exception> {
            repository.opprettMedVedtak(
                soknadId = soknad.id,
                resultat = resultat,
                besluttetAv = "x".repeat(101),
                opprettetTidspunkt = LocalDateTime.of(2026, 6, 3, 11, 0, 0),
                besluttetTidspunkt = LocalDateTime.of(2026, 6, 3, 11, 5, 0),
            )
        }

        transaction(database) {
            assertEquals(
                0,
                BehandlingTable
                    .selectAll()
                    .where { BehandlingTable.soknadId eq soknad.id }
                    .toList()
                    .size,
            )
            assertEquals(0, RegelresultatTable.selectAll().toList().size)
            assertEquals(0, VedtakTable.selectAll().toList().size)
        }
    }
}

internal fun testRegelspor(): List<Regelresultat> =
    listOf(
        Regelresultat(
            regel = Regelnavn.OPPTJENING,
            status = RegelStatus.OPPFYLT,
            begrunnelse = "Minst seks maneder med tellende inntekt",
        ),
        Regelresultat(
            regel = Regelnavn.BEREGNINGSGRUNNLAG,
            status = RegelStatus.OPPFYLT,
            begrunnelse = "Beregnet grunnlag er innenfor normalområdet",
        ),
    )
