package no.nav.fagprove.repository

import no.nav.fagprove.domain.Regelresultat
import no.nav.fagprove.domain.Saksbehandlingsresultat
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import java.time.LocalDateTime
import java.util.UUID

class BehandlingRepository(
    private val database: Database? = null,
) {
    fun opprett(
        soknadId: UUID,
        regelspor: List<Regelresultat>,
        opprettetTidspunkt: LocalDateTime = LocalDateTime.now(),
    ): Behandling =
        inRepositoryTransaction(database) {
            val behandlingId =
                insertBehandling(
                    soknadId = soknadId,
                    status = BehandlingStatus.OPPRETTET,
                    opprettetTidspunkt = opprettetTidspunkt,
                    ferdigstiltTidspunkt = null,
                )

            insertRegelspor(behandlingId, regelspor)
            checkNotNull(findBehandling(behandlingId))
        }

    fun opprettMedVedtak(
        soknadId: UUID,
        resultat: Saksbehandlingsresultat,
        besluttetAv: String,
        opprettetTidspunkt: LocalDateTime = LocalDateTime.now(),
        besluttetTidspunkt: LocalDateTime = LocalDateTime.now(),
    ): Behandling =
        inRepositoryTransaction(database) {
            val behandlingId =
                insertBehandling(
                    soknadId = soknadId,
                    status = BehandlingStatus.FERDIGSTILT,
                    opprettetTidspunkt = opprettetTidspunkt,
                    ferdigstiltTidspunkt = besluttetTidspunkt,
                )

            insertRegelspor(behandlingId, resultat.regelspor)
            insertVedtak(
                behandlingId = behandlingId,
                vedtak = resultat.vedtak,
                besluttetAv = besluttetAv,
                besluttetTidspunkt = besluttetTidspunkt,
            )

            checkNotNull(findBehandling(behandlingId))
        }

    fun hent(id: Long): Behandling? =
        inRepositoryTransaction(database) {
            findBehandling(id)
        }
}

internal fun insertBehandling(
    soknadId: UUID,
    status: BehandlingStatus,
    opprettetTidspunkt: LocalDateTime,
    ferdigstiltTidspunkt: LocalDateTime?,
): Long =
    BehandlingTable
        .insertAndGetId {
            it[BehandlingTable.soknadId] = soknadId
            it[BehandlingTable.status] = status
            it[BehandlingTable.opprettetTidspunkt] = opprettetTidspunkt
            it[BehandlingTable.ferdigstiltTidspunkt] = ferdigstiltTidspunkt
        }.value

internal fun insertRegelspor(
    behandlingId: Long,
    regelspor: List<Regelresultat>,
) {
    regelspor.forEachIndexed { index, regelresultat ->
        RegelresultatTable.insert {
            it[RegelresultatTable.behandlingId] = behandlingEntityId(behandlingId)
            it[rekkefolge] = index + 1
            it[regelnavn] = regelresultat.regel
            it[status] = regelresultat.status
            it[begrunnelse] = regelresultat.begrunnelse
        }
    }
}

internal fun findBehandling(id: Long): Behandling? =
    BehandlingTable
        .selectAll()
        .where { BehandlingTable.id eq behandlingEntityId(id) }
        .firstOrNull()
        ?.toBehandling()

private fun ResultRow.toBehandling(): Behandling {
    val behandlingId = this[BehandlingTable.id].value
    return Behandling(
        id = behandlingId,
        soknadId = this[BehandlingTable.soknadId],
        status = this[BehandlingTable.status],
        opprettetTidspunkt = this[BehandlingTable.opprettetTidspunkt],
        ferdigstiltTidspunkt = this[BehandlingTable.ferdigstiltTidspunkt],
        regelspor = findRegelspor(behandlingId),
    )
}

private fun findRegelspor(behandlingId: Long): List<Regelresultat> =
    RegelresultatTable
        .selectAll()
        .where { RegelresultatTable.behandlingId eq behandlingEntityId(behandlingId) }
        .orderBy(RegelresultatTable.rekkefolge to SortOrder.ASC)
        .map {
            Regelresultat(
                regel = it[RegelresultatTable.regelnavn],
                status = it[RegelresultatTable.status],
                begrunnelse = it[RegelresultatTable.begrunnelse],
            )
        }
