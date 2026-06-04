package no.nav.fagprove.repository

import no.nav.fagprove.domain.Dekningsgrad
import no.nav.fagprove.domain.InntektsType
import no.nav.fagprove.domain.RegelStatus
import no.nav.fagprove.domain.Regelnavn
import no.nav.fagprove.domain.Rettsforhold
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.core.java.javaUUID
import org.jetbrains.exposed.v1.javatime.date
import org.jetbrains.exposed.v1.javatime.datetime

internal object SoknadTable : Table("soknad") {
    val id = javaUUID("id")
    val fnr = varchar("fnr", 11)
    val erNorskBorger = bool("er_norsk_borger")
    val termindato = date("termindato")
    val rettsforhold = enumerationByName<Rettsforhold>("rettsforhold", 32)
    val dekningsgrad = enumerationByName<Dekningsgrad>("dekningsgrad", 32)
    val antallBarn = integer("antall_barn")
    val oppgittAarsinntektKroner = integer("oppgitt_aarsinntekt_kroner")
    val innsendt = date("innsendt")

    override val primaryKey = PrimaryKey(id)
}

internal object InntektsregistreringTable : LongIdTable("inntektsregistrering") {
    val soknadId = reference("soknad_id", SoknadTable.id)
    val maned = date("maned")
    val inntektstype = enumerationByName<InntektsType>("inntektstype", 32)
    val belopKroner = integer("belop_kroner")

    init {
        index("idx_inntektsregistrering_soknad_id", false, soknadId)
    }
}

internal object BehandlingTable : LongIdTable("behandling") {
    val soknadId = reference("soknad_id", SoknadTable.id)
    val status = enumerationByName<BehandlingStatus>("status", 32)
    val opprettetTidspunkt = datetime("opprettet_tidspunkt")
    val ferdigstiltTidspunkt = datetime("ferdigstilt_tidspunkt").nullable()

    init {
        uniqueIndex("behandling_soknad_id_key", soknadId)
    }
}

internal object RegelresultatTable : LongIdTable("regelresultat") {
    val behandlingId = reference("behandling_id", BehandlingTable)
    val rekkefolge = integer("rekkefolge")
    val regelnavn = enumerationByName<Regelnavn>("regelnavn", 64)
    val status = enumerationByName<RegelStatus>("status", 32)
    val begrunnelse = text("begrunnelse")

    init {
        index("idx_regelresultat_behandling_id", false, behandlingId)
        uniqueIndex("regelresultat_behandling_id_rekkefolge_key", behandlingId, rekkefolge)
    }
}

internal object VedtakTable : Table("vedtak") {
    val behandlingId = reference("behandling_id", BehandlingTable)
    val type = enumerationByName<VedtakType>("type", 32)
    val belopKroner = integer("belop_kroner").nullable()
    val beregningsgrunnlagKroner = integer("beregningsgrunnlag_kroner").nullable()
    val stonadsperiodeFom = date("stonadsperiode_fom").nullable()
    val stonadsperiodeTom = date("stonadsperiode_tom").nullable()
    val stonadsperiodeUker = integer("stonadsperiode_uker").nullable()
    val modrekvoteUker = integer("modrekvote_uker").nullable()
    val fedrekvoteUker = integer("fedrekvote_uker").nullable()
    val fellesperiodeUker = integer("fellesperiode_uker").nullable()
    val bonusuker = integer("bonusuker").nullable()
    val forskuddUker = integer("forskudd_uker").nullable()
    val begrunnelse = text("begrunnelse")
    val besluttetAv = varchar("besluttet_av", 100)
    val besluttetTidspunkt = datetime("besluttet_tidspunkt")

    override val primaryKey = PrimaryKey(behandlingId)
}

internal fun behandlingEntityId(id: Long): EntityID<Long> = EntityID(id, BehandlingTable)
