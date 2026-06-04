package no.nav.fagprove.dto

import kotlinx.serialization.Serializable

@Serializable
data class SoknadListeResponse(
    val soknader: List<SoknadListeDto>,
)

@Serializable
data class SoknadListeDto(
    val id: String,
    val sokerIdent: String,
    val innsendt: String,
    val termindato: String,
    val rettsforhold: String,
    val dekningsgrad: String,
    val antallBarn: Int,
    val oppgittAarsinntektKroner: Int,
    val beskrivelse: String? = null,
)

@Serializable
data class StartBehandlingRequest(
    val soknadId: String,
)

@Serializable
data class BehandlingResultatResponse(
    val sakId: Long,
    val soknadId: String,
    val status: SakStatusDto,
    val vedtaksvariant: VedtaksvariantDto,
    val regelspor: List<RegelresultatDto>,
    val vedtak: VedtakDto? = null,
    val manuellVurdering: ManuellVurderingDto? = null,
)

@Serializable
data class SakResponse(
    val sakId: Long,
    val soknad: SaksdataDto,
    val status: SakStatusDto,
    val opprettetTidspunkt: String,
    val ferdigstiltTidspunkt: String? = null,
    val regelspor: List<RegelresultatDto>,
    val vedtak: VedtakDto? = null,
    val manuellVurdering: ManuellVurderingDto? = null,
)

@Serializable
data class InternMerknadRequest(
    val komplisert: Boolean,
    val kommentar: String? = null,
    val oppdatertAv: String? = null,
)

@Serializable
data class InternMerknadResponse(
    val sakId: Long,
    val komplisert: Boolean,
    val kommentar: String,
    val oppdatertAv: String?,
    val oppdatertTidspunkt: String?,
)

@Serializable
data class InterneMerknaderResponse(
    val saker: List<InternMerknadOversiktDto>,
)

@Serializable
data class InternMerknadOversiktDto(
    val sakId: Long,
    val saksnummer: String,
    val sokerIdent: String,
    val status: SakStatusDto,
    val vedtaksvariant: VedtaksvariantDto,
    val komplisert: Boolean,
    val kommentar: String,
    val oppdatertAv: String,
    val oppdatertTidspunkt: String,
)

@Serializable
data class SaksdataDto(
    val id: String,
    val sokerIdent: String,
    val erNorskBorger: Boolean,
    val innsendt: String,
    val termindato: String,
    val rettsforhold: String,
    val dekningsgrad: String,
    val antallBarn: Int,
    val oppgittAarsinntektKroner: Int,
    val inntekter: List<InntektDto>,
)

@Serializable
data class InntektDto(
    val maned: String,
    val type: String,
    val belopKroner: Int,
)

@Serializable
data class RegelresultatDto(
    val regel: String,
    val status: String,
    val begrunnelse: String,
)

@Serializable
data class ManuellVurderingDto(
    val grunn: String,
)

@Serializable
data class VedtakDto(
    val variant: VedtaksvariantDto,
    val begrunnelse: String,
    val belopKroner: Int? = null,
    val stonadsperiode: StonadsperiodeDto? = null,
    val kvoter: KvoterDto? = null,
    val besluttetAv: String? = null,
    val besluttetTidspunkt: String? = null,
)

@Serializable
data class StonadsperiodeDto(
    val fom: String,
    val tom: String,
    val uker: Int,
)

@Serializable
data class KvoterDto(
    val modrekvoteUker: Int,
    val fedrekvoteUker: Int,
    val fellesperiodeUker: Int,
    val bonusuker: Int,
    val forskuddUker: Int,
    val totalUker: Int,
)

@Serializable
data class ManuellBeslutningRequest(
    val type: ManuellBeslutningTypeDto,
    val begrunnelse: String,
    val besluttetAv: String,
)

@Serializable
enum class ManuellBeslutningTypeDto {
    INNVILGELSE,
    AVSLAG,
}

@Serializable
enum class SakStatusDto {
    OPPRETTET,
    TIL_MANUELL_VURDERING,
    FERDIGSTILT,
}

@Serializable
enum class VedtaksvariantDto {
    INNVILGET,
    AVSLAG,
    ENGANGSSTONAD,
    MANUELL_VURDERING,
}
