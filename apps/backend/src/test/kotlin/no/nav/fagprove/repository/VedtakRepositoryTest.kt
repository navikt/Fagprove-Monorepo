package no.nav.fagprove.repository

import no.nav.fagprove.domain.Penger
import no.nav.fagprove.domain.Vedtak
import no.nav.fagprove.domain.testKvoter
import no.nav.fagprove.domain.testSoknad
import no.nav.fagprove.domain.testStonadsperiode
import java.time.LocalDateTime
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class VedtakRepositoryTest {
    @Test
    fun `lagrer endelig vedtak med begrunnelse tidspunkt og besluttet av`() {
        val database = repositoryTestDatabase()
        val soknad = testSoknad()
        SoknadRepository(database).lagre(soknad)
        val behandling =
            BehandlingRepository(database).opprett(
                soknadId = soknad.id,
                regelspor = testRegelspor(),
                opprettetTidspunkt = LocalDateTime.of(2026, 6, 3, 12, 0, 0),
            )
        val repository = VedtakRepository(database)
        val besluttetTidspunkt = LocalDateTime.of(2026, 6, 3, 12, 30, 0)
        val vedtak =
            Vedtak.Innvilget(
                belop = Penger(456_000),
                stonadsperiode = testStonadsperiode(totalUker = 49),
                kvoter = testKvoter(totalUker = 49),
                begrunnelse = "Soknaden er innvilget etter automatisk vurdering",
            )

        val lagret =
            repository.lagre(
                behandlingId = behandling.id,
                vedtak = vedtak,
                besluttetAv = "Z990123",
                besluttetTidspunkt = besluttetTidspunkt,
            )

        assertEquals(behandling.id, lagret.behandlingId)
        assertEquals(vedtak, lagret.vedtak)
        assertEquals("Soknaden er innvilget etter automatisk vurdering", lagret.begrunnelse)
        assertEquals("Z990123", lagret.besluttetAv)
        assertEquals(besluttetTidspunkt, lagret.besluttetTidspunkt)

        assertEquals(lagret, assertNotNull(repository.hentForBehandling(behandling.id)))
        val ferdigstiltBehandling = assertNotNull(BehandlingRepository(database).hent(behandling.id))
        assertEquals(BehandlingStatus.FERDIGSTILT, ferdigstiltBehandling.status)
        assertEquals(besluttetTidspunkt, ferdigstiltBehandling.ferdigstiltTidspunkt)
    }
}
