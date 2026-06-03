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

internal enum class VedtakType {
    INNVILGET,
    AVSLAG,
    ENGANGSSTONAD,
    MANUELL_VURDERING,
}
