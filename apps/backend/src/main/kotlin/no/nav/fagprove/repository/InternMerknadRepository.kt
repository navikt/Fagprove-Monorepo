package no.nav.fagprove.repository

import no.nav.fagprove.domain.RegelStatus
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.exceptions.ExposedSQLException
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import java.time.LocalDateTime

class InternMerknadRepository(
    private val database: Database? = null,
) {
    fun hentForBehandling(behandlingId: Long): InternMerknad? =
        inRepositoryTransaction(database) {
            findForBehandling(behandlingId)
        }

    fun lagreEllerOppdater(
        behandlingId: Long,
        komplisert: Boolean,
        kommentar: String,
        oppdatertAv: String,
        oppdatertTidspunkt: LocalDateTime = LocalDateTime.now(),
    ): InternMerknad =
        inRepositoryTransaction(database) {
            val oppdaterteRader =
                updateInternMerknad(
                    behandlingId = behandlingId,
                    komplisert = komplisert,
                    kommentar = kommentar,
                    oppdatertAv = oppdatertAv,
                    oppdatertTidspunkt = oppdatertTidspunkt,
                )

            if (oppdaterteRader == 0) {
                try {
                    insertInternMerknad(
                        behandlingId = behandlingId,
                        komplisert = komplisert,
                        kommentar = kommentar,
                        oppdatertAv = oppdatertAv,
                        oppdatertTidspunkt = oppdatertTidspunkt,
                    )
                } catch (cause: ExposedSQLException) {
                    if (!cause.isUniqueViolation()) {
                        throw cause
                    }
                    updateInternMerknad(
                        behandlingId = behandlingId,
                        komplisert = komplisert,
                        kommentar = kommentar,
                        oppdatertAv = oppdatertAv,
                        oppdatertTidspunkt = oppdatertTidspunkt,
                    )
                }
            }

            checkNotNull(findForBehandling(behandlingId))
        }

    fun hentAlleMedInternOppfolging(): List<InternMerknadOppfolging> =
        inRepositoryTransaction(database) {
            val rows =
                InternMerknadTable
                    .innerJoin(BehandlingTable)
                    .innerJoin(SoknadTable)
                    .selectAll()
                    .where { InternMerknadTable.komplisert eq true }
                    .orderBy(
                        InternMerknadTable.oppdatertTidspunkt to SortOrder.DESC,
                        InternMerknadTable.id to SortOrder.DESC,
                    ).toList()
            val behandlingIds = rows.map { it[BehandlingTable.id].value }
            val vedtakTyper = findVedtakTyper(behandlingIds)
            val behandlingerMedManuellVurdering = findBehandlingerMedManuellVurdering(behandlingIds)

            rows.map { row ->
                val behandlingId = row[BehandlingTable.id].value
                InternMerknadOppfolging(
                    merknad = row.toInternMerknad(),
                    soknadId = row[SoknadTable.id],
                    fnr = row[SoknadTable.fnr],
                    behandlingStatus = row[BehandlingTable.status],
                    vedtakType = vedtakTyper[behandlingId],
                    harManuellVurdering = behandlingId in behandlingerMedManuellVurdering,
                )
            }
        }
}

private fun findForBehandling(behandlingId: Long): InternMerknad? =
    InternMerknadTable
        .selectAll()
        .where { InternMerknadTable.behandlingId eq behandlingEntityId(behandlingId) }
        .firstOrNull()
        ?.toInternMerknad()

private fun insertInternMerknad(
    behandlingId: Long,
    komplisert: Boolean,
    kommentar: String,
    oppdatertAv: String,
    oppdatertTidspunkt: LocalDateTime,
) {
    InternMerknadTable.insertAndGetId {
        it[InternMerknadTable.behandlingId] = behandlingEntityId(behandlingId)
        it[InternMerknadTable.komplisert] = komplisert
        it[InternMerknadTable.kommentar] = kommentar
        it[InternMerknadTable.oppdatertAv] = oppdatertAv
        it[InternMerknadTable.oppdatertTidspunkt] = oppdatertTidspunkt
    }
}

private fun updateInternMerknad(
    behandlingId: Long,
    komplisert: Boolean,
    kommentar: String,
    oppdatertAv: String,
    oppdatertTidspunkt: LocalDateTime,
): Int =
    InternMerknadTable.update({ InternMerknadTable.behandlingId eq behandlingEntityId(behandlingId) }) {
        it[InternMerknadTable.komplisert] = komplisert
        it[InternMerknadTable.kommentar] = kommentar
        it[InternMerknadTable.oppdatertAv] = oppdatertAv
        it[InternMerknadTable.oppdatertTidspunkt] = oppdatertTidspunkt
    }

private fun findVedtakTyper(behandlingIds: List<Long>): Map<Long, VedtakType> {
    if (behandlingIds.isEmpty()) {
        return emptyMap()
    }

    return VedtakTable
        .selectAll()
        .where { VedtakTable.behandlingId inList behandlingIds.map(::behandlingEntityId) }
        .associate { it[VedtakTable.behandlingId].value to it[VedtakTable.type] }
}

private fun findBehandlingerMedManuellVurdering(behandlingIds: List<Long>): Set<Long> {
    if (behandlingIds.isEmpty()) {
        return emptySet()
    }

    return RegelresultatTable
        .selectAll()
        .where {
            (RegelresultatTable.behandlingId inList behandlingIds.map(::behandlingEntityId)) and
                (RegelresultatTable.status eq RegelStatus.MANUELL_VURDERING)
        }.mapTo(mutableSetOf()) { it[RegelresultatTable.behandlingId].value }
}

private fun ResultRow.toInternMerknad(): InternMerknad =
    InternMerknad(
        id = this[InternMerknadTable.id].value,
        behandlingId = this[InternMerknadTable.behandlingId].value,
        komplisert = this[InternMerknadTable.komplisert],
        kommentar = this[InternMerknadTable.kommentar],
        oppdatertAv = this[InternMerknadTable.oppdatertAv],
        oppdatertTidspunkt = this[InternMerknadTable.oppdatertTidspunkt],
    )

private const val UNIQUE_VIOLATION_SQL_STATE = "23505"

private fun ExposedSQLException.isUniqueViolation(): Boolean = sqlState == UNIQUE_VIOLATION_SQL_STATE
