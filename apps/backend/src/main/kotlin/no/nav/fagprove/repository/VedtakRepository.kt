package no.nav.fagprove.repository

import no.nav.fagprove.domain.Vedtak
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import java.time.LocalDateTime

class VedtakRepository(
    private val database: Database? = null,
) {
    fun lagre(
        behandlingId: Long,
        vedtak: Vedtak,
        besluttetAv: String,
        besluttetTidspunkt: LocalDateTime = LocalDateTime.now(),
    ): LagretVedtak =
        inRepositoryTransaction(database) {
            VedtakTable.deleteWhere { VedtakTable.behandlingId eq behandlingEntityId(behandlingId) }
            insertVedtak(
                behandlingId = behandlingId,
                vedtak = vedtak,
                besluttetAv = besluttetAv,
                besluttetTidspunkt = besluttetTidspunkt,
            )
            BehandlingTable.update({ BehandlingTable.id eq behandlingEntityId(behandlingId) }) {
                it[status] = BehandlingStatus.FERDIGSTILT
                it[ferdigstiltTidspunkt] = besluttetTidspunkt
            }

            checkNotNull(findForBehandling(behandlingId))
        }

    fun hentForBehandling(behandlingId: Long): LagretVedtak? =
        inRepositoryTransaction(database) {
            findForBehandling(behandlingId)
        }
}

internal fun insertVedtak(
    behandlingId: Long,
    vedtak: Vedtak,
    besluttetAv: String,
    besluttetTidspunkt: LocalDateTime,
) {
    VedtakTable.insert {
        it[VedtakTable.behandlingId] = behandlingEntityId(behandlingId)
        it.setVedtakColumns(vedtak)
        it[VedtakTable.besluttetAv] = besluttetAv
        it[VedtakTable.besluttetTidspunkt] = besluttetTidspunkt
    }
}

private fun findForBehandling(behandlingId: Long): LagretVedtak? =
    VedtakTable
        .selectAll()
        .where { VedtakTable.behandlingId eq behandlingEntityId(behandlingId) }
        .firstOrNull()
        ?.toLagretVedtak()
