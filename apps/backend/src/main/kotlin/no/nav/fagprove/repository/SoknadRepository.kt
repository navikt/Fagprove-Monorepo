package no.nav.fagprove.repository

import no.nav.fagprove.domain.Inntektsregistrering
import no.nav.fagprove.domain.Penger
import no.nav.fagprove.domain.Soknad
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import java.time.YearMonth
import java.util.UUID

class SoknadRepository(
    private val database: Database? = null,
) {
    fun lagre(soknad: Soknad): Soknad =
        inRepositoryTransaction(database) {
            val finnes =
                !SoknadTable
                    .selectAll()
                    .where { SoknadTable.id eq soknad.id }
                    .empty()

            if (finnes) {
                SoknadTable.update({ SoknadTable.id eq soknad.id }) {
                    it[fnr] = soknad.fnr
                    it[erNorskBorger] = soknad.erNorskBorger
                    it[termindato] = soknad.termindato
                    it[rettsforhold] = soknad.rettsforhold
                    it[dekningsgrad] = soknad.dekningsgrad
                    it[antallBarn] = soknad.antallBarn
                    it[oppgittAarsinntektKroner] = soknad.oppgittAarsinntekt.kroner
                    it[innsendt] = soknad.innsendt
                    it[beskrivelse] = soknad.beskrivelse
                }
            } else {
                SoknadTable.insert {
                    it[id] = soknad.id
                    it[fnr] = soknad.fnr
                    it[erNorskBorger] = soknad.erNorskBorger
                    it[termindato] = soknad.termindato
                    it[rettsforhold] = soknad.rettsforhold
                    it[dekningsgrad] = soknad.dekningsgrad
                    it[antallBarn] = soknad.antallBarn
                    it[oppgittAarsinntektKroner] = soknad.oppgittAarsinntekt.kroner
                    it[innsendt] = soknad.innsendt
                    it[beskrivelse] = soknad.beskrivelse
                }
            }

            InntektsregistreringTable.deleteWhere {
                InntektsregistreringTable.soknadId eq soknad.id
            }
            soknad.inntekter.forEach { inntekt ->
                InntektsregistreringTable.insert {
                    it[soknadId] = soknad.id
                    it[maned] = inntekt.maned.atDay(1)
                    it[inntektstype] = inntekt.type
                    it[belopKroner] = inntekt.belop.kroner
                }
            }

            soknad
        }

    fun hent(id: UUID): Soknad? =
        inRepositoryTransaction(database) {
            val soknadRow =
                SoknadTable
                    .selectAll()
                    .where { SoknadTable.id eq id }
                    .firstOrNull()

            soknadRow?.toSoknad()
        }

    fun hentAlle(): List<Soknad> =
        inRepositoryTransaction(database) {
            val soknadRows =
                SoknadTable
                    .selectAll()
                    .orderBy(
                        SoknadTable.innsendt to SortOrder.ASC,
                        SoknadTable.fnr to SortOrder.ASC,
                    ).toList()
            val inntekterBySoknadId =
                findInntekterForSoknader(
                    soknadRows.map { it[SoknadTable.id] },
                )

            soknadRows.map { row ->
                row.toSoknad(
                    inntekter = inntekterBySoknadId[row[SoknadTable.id]].orEmpty(),
                )
            }
        }

    private fun ResultRow.toSoknad(): Soknad {
        val soknadId = this[SoknadTable.id]
        return toSoknad(
            inntekter = findInntekterForSoknad(soknadId),
        )
    }

    private fun ResultRow.toSoknad(inntekter: List<Inntektsregistrering>): Soknad =
        Soknad(
            id = this[SoknadTable.id],
            fnr = this[SoknadTable.fnr],
            erNorskBorger = this[SoknadTable.erNorskBorger],
            inntekter = inntekter,
            termindato = this[SoknadTable.termindato],
            rettsforhold = this[SoknadTable.rettsforhold],
            dekningsgrad = this[SoknadTable.dekningsgrad],
            antallBarn = this[SoknadTable.antallBarn],
            oppgittAarsinntekt = Penger(this[SoknadTable.oppgittAarsinntektKroner]),
            innsendt = this[SoknadTable.innsendt],
            beskrivelse = this[SoknadTable.beskrivelse],
        )

    private fun findInntekterForSoknad(soknadId: UUID): List<Inntektsregistrering> =
        InntektsregistreringTable
            .selectAll()
            .where { InntektsregistreringTable.soknadId eq soknadId }
            .orderBy(
                InntektsregistreringTable.maned to SortOrder.ASC,
                InntektsregistreringTable.id to SortOrder.ASC,
            ).map { it.toInntektsregistrering() }

    private fun findInntekterForSoknader(soknadIds: List<UUID>): Map<UUID, List<Inntektsregistrering>> {
        if (soknadIds.isEmpty()) {
            return emptyMap()
        }

        return InntektsregistreringTable
            .selectAll()
            .where { InntektsregistreringTable.soknadId inList soknadIds }
            .orderBy(
                InntektsregistreringTable.soknadId to SortOrder.ASC,
                InntektsregistreringTable.maned to SortOrder.ASC,
                InntektsregistreringTable.id to SortOrder.ASC,
            ).groupBy(
                keySelector = { it[InntektsregistreringTable.soknadId] },
                valueTransform = { it.toInntektsregistrering() },
            )
    }

    private fun ResultRow.toInntektsregistrering(): Inntektsregistrering =
        Inntektsregistrering(
            maned = YearMonth.from(this[InntektsregistreringTable.maned]),
            type = this[InntektsregistreringTable.inntektstype],
            belop = Penger(this[InntektsregistreringTable.belopKroner]),
        )
}
