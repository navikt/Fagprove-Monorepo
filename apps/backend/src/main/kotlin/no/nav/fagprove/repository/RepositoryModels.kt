package no.nav.fagprove.repository

import no.nav.fagprove.domain.Regelresultat
import no.nav.fagprove.domain.Vedtak
import java.time.LocalDateTime
import java.util.UUID

enum class BehandlingStatus {
    OPPRETTET,
    FERDIGSTILT,
}

data class Behandling(
    val id: Long,
    val soknadId: UUID,
    val status: BehandlingStatus,
    val opprettetTidspunkt: LocalDateTime,
    val ferdigstiltTidspunkt: LocalDateTime?,
    val regelspor: List<Regelresultat>,
)

data class LagretVedtak(
    val behandlingId: Long,
    val vedtak: Vedtak,
    val begrunnelse: String,
    val besluttetAv: String,
    val besluttetTidspunkt: LocalDateTime,
)

data class InternMerknad(
    val id: Long,
    val behandlingId: Long,
    val komplisert: Boolean,
    val kommentar: String,
    val oppdatertAv: String,
    val oppdatertTidspunkt: LocalDateTime,
)

data class InternMerknadOppfolging(
    val merknad: InternMerknad,
    val soknadId: UUID,
    val fnr: String,
    val behandlingStatus: BehandlingStatus,
    val vedtakType: VedtakType?,
    val harManuellVurdering: Boolean,
)

enum class VedtakType {
    INNVILGET,
    AVSLAG,
    ENGANGSSTONAD,
    MANUELL_VURDERING,
}
