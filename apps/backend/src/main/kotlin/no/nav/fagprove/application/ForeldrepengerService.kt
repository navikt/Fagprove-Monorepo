package no.nav.fagprove.application

import no.nav.fagprove.api.ApiConflictException
import no.nav.fagprove.api.ApiNotFoundException
import no.nav.fagprove.domain.ManuellBeslutning
import no.nav.fagprove.domain.RegelStatus
import no.nav.fagprove.domain.Saksbehandling
import no.nav.fagprove.domain.Soknad
import no.nav.fagprove.domain.Vedtak
import no.nav.fagprove.repository.Behandling
import no.nav.fagprove.repository.BehandlingRepository
import no.nav.fagprove.repository.BehandlingStatus
import no.nav.fagprove.repository.InternMerknad
import no.nav.fagprove.repository.InternMerknadOppfolging
import no.nav.fagprove.repository.InternMerknadRepository
import no.nav.fagprove.repository.LagretVedtak
import no.nav.fagprove.repository.SoknadRepository
import no.nav.fagprove.repository.VedtakRepository
import org.jetbrains.exposed.v1.exceptions.ExposedSQLException
import java.util.UUID

class ForeldrepengerService(
    private val soknadRepository: SoknadRepository,
    private val behandlingRepository: BehandlingRepository,
    private val vedtakRepository: VedtakRepository,
    private val internMerknadRepository: InternMerknadRepository,
) {
    fun listSoknader(): List<Soknad> = soknadRepository.hentAlle()

    fun startBehandling(soknadId: UUID): StartBehandlingResult =
        eksisterendeStartBehandling(soknadId)
            ?: opprettStartBehandling(soknadId)

    fun hentSak(sakId: Long): SakResult {
        val behandling = krevBehandling(sakId)
        val soknad =
            soknadRepository.hent(behandling.soknadId)
                ?: throw ApiNotFoundException("Søknaden finnes ikke")

        return SakResult(
            behandling = behandling,
            soknad = soknad,
            lagretVedtak = vedtakRepository.hentForBehandling(sakId),
        )
    }

    fun hentInternMerknad(sakId: Long): InternMerknad? {
        krevBehandling(sakId)
        return internMerknadRepository.hentForBehandling(sakId)
    }

    fun lagreInternMerknad(
        sakId: Long,
        komplisert: Boolean,
        kommentar: String,
        oppdatertAv: String,
    ): InternMerknad {
        krevBehandling(sakId)
        return internMerknadRepository.lagreEllerOppdater(
            behandlingId = sakId,
            komplisert = komplisert,
            kommentar = kommentar,
            oppdatertAv = oppdatertAv,
        )
    }

    fun listInterneMerknader(): List<InternMerknadOppfolging> = internMerknadRepository.hentAlleMedInternOppfolging()

    fun besluttManuelt(
        sakId: Long,
        beslutning: ManuellBeslutning,
        begrunnelse: String,
        besluttetAv: String,
    ): SakResult {
        val behandling = krevBehandling(sakId)
        val soknad =
            soknadRepository.hent(behandling.soknadId)
                ?: throw ApiNotFoundException("Søknaden finnes ikke")
        val lagretVedtak = vedtakRepository.hentForBehandling(sakId)

        if (!behandling.venterPaaManuellBeslutning(lagretVedtak)) {
            throw ApiConflictException("Saken venter ikke på manuell beslutning")
        }

        val vedtak =
            Saksbehandling.besluttManuelt(
                soknad = soknad,
                beslutning = beslutning,
                begrunnelse = begrunnelse,
            )
        vedtakRepository.lagre(
            behandlingId = sakId,
            vedtak = vedtak,
            besluttetAv = besluttetAv,
        )

        return SakResult(
            behandling = checkNotNull(behandlingRepository.hent(sakId)),
            soknad = soknad,
            lagretVedtak = vedtakRepository.hentForBehandling(sakId),
        )
    }

    private fun krevBehandling(sakId: Long): Behandling =
        behandlingRepository.hent(sakId)
            ?: throw ApiNotFoundException("Saken finnes ikke")

    private fun eksisterendeStartBehandling(soknadId: UUID): StartBehandlingResult? =
        behandlingRepository.hentForSoknad(soknadId)?.let { behandling ->
            StartBehandlingResult(
                behandling = behandling,
                lagretVedtak = vedtakRepository.hentForBehandling(behandling.id),
                manuellVurdering = null,
                created = false,
            )
        }

    private fun opprettStartBehandling(soknadId: UUID): StartBehandlingResult {
        val soknad =
            soknadRepository.hent(soknadId)
                ?: throw ApiNotFoundException("Søknaden finnes ikke")
        val resultat = Saksbehandling.behandle(soknad)
        val manuellVurdering = resultat.vedtak as? Vedtak.ManuellVurdering

        val opprettetBehandling =
            try {
                OpprettetBehandling(
                    behandling =
                        if (manuellVurdering != null) {
                            behandlingRepository.opprett(
                                soknadId = soknad.id,
                                regelspor = resultat.regelspor,
                            )
                        } else {
                            behandlingRepository.opprettMedVedtak(
                                soknadId = soknad.id,
                                resultat = resultat,
                                besluttetAv = AUTOMATISK_SAKSBEHANDLER,
                            )
                        },
                    created = true,
                )
            } catch (cause: ExposedSQLException) {
                if (!cause.isUniqueViolation()) {
                    throw cause
                }
                OpprettetBehandling(
                    behandling = behandlingRepository.hentForSoknad(soknadId) ?: throw cause,
                    created = false,
                )
            }

        return StartBehandlingResult(
            behandling = opprettetBehandling.behandling,
            lagretVedtak = vedtakRepository.hentForBehandling(opprettetBehandling.behandling.id),
            manuellVurdering =
                manuellVurdering.takeIf {
                    opprettetBehandling.created &&
                        opprettetBehandling.behandling.soknadId == soknad.id
                },
            created = opprettetBehandling.created,
        )
    }
}

private data class OpprettetBehandling(
    val behandling: Behandling,
    val created: Boolean,
)

data class StartBehandlingResult(
    val behandling: Behandling,
    val lagretVedtak: LagretVedtak?,
    val manuellVurdering: Vedtak.ManuellVurdering?,
    val created: Boolean,
)

data class SakResult(
    val behandling: Behandling,
    val soknad: Soknad,
    val lagretVedtak: LagretVedtak?,
)

private const val AUTOMATISK_SAKSBEHANDLER = "system"
private const val UNIQUE_VIOLATION_SQL_STATE = "23505"

private fun ExposedSQLException.isUniqueViolation(): Boolean = sqlState == UNIQUE_VIOLATION_SQL_STATE

private fun Behandling.venterPaaManuellBeslutning(lagretVedtak: LagretVedtak?): Boolean =
    status == BehandlingStatus.OPPRETTET &&
        lagretVedtak == null &&
        regelspor.any { it.status == RegelStatus.MANUELL_VURDERING }
