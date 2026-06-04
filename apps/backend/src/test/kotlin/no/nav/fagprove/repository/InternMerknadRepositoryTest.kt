package no.nav.fagprove.repository

import no.nav.fagprove.domain.testSoknad
import java.time.LocalDateTime
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class InternMerknadRepositoryTest {
    @Test
    fun `lagrer og henter intern merknad for behandling`() {
        val database = repositoryTestDatabase()
        val behandling = opprettTestbehandling(database)
        val repository = InternMerknadRepository(database)
        val oppdatertTidspunkt = LocalDateTime.of(2026, 6, 4, 9, 0, 0)

        val merknad =
            repository.lagreEllerOppdater(
                behandlingId = behandling.id,
                komplisert = true,
                kommentar = "Krevende helhetsvurdering",
                oppdatertAv = "Z990123",
                oppdatertTidspunkt = oppdatertTidspunkt,
            )

        assertEquals(behandling.id, merknad.behandlingId)
        assertEquals(true, merknad.komplisert)
        assertEquals("Krevende helhetsvurdering", merknad.kommentar)
        assertEquals("Z990123", merknad.oppdatertAv)
        assertEquals(oppdatertTidspunkt, merknad.oppdatertTidspunkt)
        assertEquals(merknad, assertNotNull(repository.hentForBehandling(behandling.id)))
        assertNull(repository.hentForBehandling(behandling.id + 1000))
    }

    @Test
    fun `oppdaterer eksisterende intern merknad uten aa lage ny rad`() {
        val database = repositoryTestDatabase()
        val behandling = opprettTestbehandling(database)
        val repository = InternMerknadRepository(database)
        val forsteTidspunkt = LocalDateTime.of(2026, 6, 4, 9, 0, 0)
        val andreTidspunkt = LocalDateTime.of(2026, 6, 4, 10, 0, 0)
        val forste =
            repository.lagreEllerOppdater(
                behandlingId = behandling.id,
                komplisert = true,
                kommentar = "Første vurdering",
                oppdatertAv = "Z990123",
                oppdatertTidspunkt = forsteTidspunkt,
            )

        val oppdatert =
            repository.lagreEllerOppdater(
                behandlingId = behandling.id,
                komplisert = false,
                kommentar = "",
                oppdatertAv = "Z990456",
                oppdatertTidspunkt = andreTidspunkt,
            )

        assertEquals(forste.id, oppdatert.id)
        assertEquals(false, oppdatert.komplisert)
        assertEquals("", oppdatert.kommentar)
        assertEquals("Z990456", oppdatert.oppdatertAv)
        assertEquals(andreTidspunkt, oppdatert.oppdatertTidspunkt)
        assertEquals(oppdatert, assertNotNull(repository.hentForBehandling(behandling.id)))
    }

    @Test
    fun `oversikt returnerer kun saker med intern oppfolging sortert paa sist oppdatert`() {
        val database = repositoryTestDatabase()
        val eldste = opprettTestbehandling(database, fnr = "12345678901")
        val ikkeMarkert = opprettTestbehandling(database, fnr = "12345678902")
        val nyeste = opprettTestbehandling(database, fnr = "12345678903")
        val repository = InternMerknadRepository(database)

        repository.lagreEllerOppdater(
            behandlingId = eldste.id,
            komplisert = true,
            kommentar = "Eldre merknad",
            oppdatertAv = "Z990123",
            oppdatertTidspunkt = LocalDateTime.of(2026, 6, 4, 9, 0, 0),
        )
        repository.lagreEllerOppdater(
            behandlingId = ikkeMarkert.id,
            komplisert = false,
            kommentar = "",
            oppdatertAv = "Z990123",
            oppdatertTidspunkt = LocalDateTime.of(2026, 6, 4, 12, 0, 0),
        )
        repository.lagreEllerOppdater(
            behandlingId = nyeste.id,
            komplisert = true,
            kommentar = "Nyeste merknad",
            oppdatertAv = "Z990456",
            oppdatertTidspunkt = LocalDateTime.of(2026, 6, 4, 11, 0, 0),
        )

        val oversikt = repository.hentAlleMedInternOppfolging()

        assertEquals(listOf(nyeste.id, eldste.id), oversikt.map { it.merknad.behandlingId })
        assertEquals(listOf("12345678903", "12345678901"), oversikt.map { it.fnr })
        assertEquals(listOf("Nyeste merknad", "Eldre merknad"), oversikt.map { it.merknad.kommentar })
    }

    private fun opprettTestbehandling(
        database: org.jetbrains.exposed.v1.jdbc.Database,
        fnr: String = "12345678901",
    ): Behandling {
        val soknad = testSoknad().copy(fnr = fnr)
        SoknadRepository(database).lagre(soknad)
        return BehandlingRepository(database).opprett(
            soknadId = soknad.id,
            regelspor = testRegelspor(),
            opprettetTidspunkt = LocalDateTime.of(2026, 6, 4, 8, 0, 0),
        )
    }
}
