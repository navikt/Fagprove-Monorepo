package no.nav.fagprove.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import no.nav.fagprove.api.ApiConflictException
import no.nav.fagprove.api.ApiNotFoundException
import no.nav.fagprove.api.ApiValidationException
import no.nav.fagprove.domain.ManuellBeslutning
import no.nav.fagprove.domain.RegelStatus
import no.nav.fagprove.domain.Regelresultat
import no.nav.fagprove.domain.Saksbehandling
import no.nav.fagprove.domain.Soknad
import no.nav.fagprove.domain.Vedtak
import no.nav.fagprove.dto.BehandlingResultatResponse
import no.nav.fagprove.dto.FieldError
import no.nav.fagprove.dto.InntektDto
import no.nav.fagprove.dto.KvoterDto
import no.nav.fagprove.dto.ManuellBeslutningRequest
import no.nav.fagprove.dto.ManuellBeslutningTypeDto
import no.nav.fagprove.dto.ManuellVurderingDto
import no.nav.fagprove.dto.RegelresultatDto
import no.nav.fagprove.dto.SakResponse
import no.nav.fagprove.dto.SakStatusDto
import no.nav.fagprove.dto.SaksdataDto
import no.nav.fagprove.dto.SoknadListeDto
import no.nav.fagprove.dto.SoknadListeResponse
import no.nav.fagprove.dto.StartBehandlingRequest
import no.nav.fagprove.dto.StonadsperiodeDto
import no.nav.fagprove.dto.VedtakDto
import no.nav.fagprove.dto.VedtaksvariantDto
import no.nav.fagprove.repository.Behandling
import no.nav.fagprove.repository.BehandlingRepository
import no.nav.fagprove.repository.BehandlingStatus
import no.nav.fagprove.repository.LagretVedtak
import no.nav.fagprove.repository.SoknadRepository
import no.nav.fagprove.repository.VedtakRepository
import java.util.UUID

fun Route.foreldrepengerRoutes(
    soknadRepository: SoknadRepository,
    behandlingRepository: BehandlingRepository,
    vedtakRepository: VedtakRepository,
) {
    route("/api/foreldrepenger") {
        get("/soknader") {
            val response =
                SoknadListeResponse(
                    soknader = soknadRepository.hentAlle().map { it.toListeDto() },
                )

            call.respond(response)
        }

        post("/vedtak") {
            val request = call.receive<StartBehandlingRequest>()
            val soknadId = request.validertSoknadId()
            val soknad =
                soknadRepository.hent(soknadId)
                    ?: throw ApiNotFoundException("Søknaden finnes ikke")

            val resultat = Saksbehandling.behandle(soknad)
            val behandling =
                if (resultat.vedtak is Vedtak.ManuellVurdering) {
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
                }

            val lagretVedtak =
                if (resultat.vedtak is Vedtak.ManuellVurdering) {
                    null
                } else {
                    checkNotNull(vedtakRepository.hentForBehandling(behandling.id))
                }

            call.respond(
                HttpStatusCode.Created,
                behandling.toResultatResponse(
                    lagretVedtak = lagretVedtak,
                    manuellVurdering = resultat.vedtak as? Vedtak.ManuellVurdering,
                ),
            )
        }

        get("/saker/{id}") {
            val sakId = call.sakId()
            val behandling =
                behandlingRepository.hent(sakId)
                    ?: throw ApiNotFoundException("Saken finnes ikke")
            val soknad =
                soknadRepository.hent(behandling.soknadId)
                    ?: throw ApiNotFoundException("Søknaden finnes ikke")

            call.respond(
                behandling.toSakResponse(
                    soknad = soknad,
                    lagretVedtak = vedtakRepository.hentForBehandling(sakId),
                ),
            )
        }

        post("/saker/{id}/beslutning") {
            val sakId = call.sakId()
            val request = call.receive<ManuellBeslutningRequest>()
            val validertRequest = request.valider()

            val behandling =
                behandlingRepository.hent(sakId)
                    ?: throw ApiNotFoundException("Saken finnes ikke")
            val soknad =
                soknadRepository.hent(behandling.soknadId)
                    ?: throw ApiNotFoundException("Søknaden finnes ikke")

            if (!behandling.venterPaaManuellBeslutning(vedtakRepository.hentForBehandling(sakId))) {
                throw ApiConflictException("Saken venter ikke på manuell beslutning")
            }

            val vedtak =
                Saksbehandling.besluttManuelt(
                    soknad = soknad,
                    beslutning = validertRequest.type,
                    begrunnelse = validertRequest.begrunnelse,
                )
            vedtakRepository.lagre(
                behandlingId = sakId,
                vedtak = vedtak,
                besluttetAv = validertRequest.besluttetAv,
            )

            val oppdatertBehandling = checkNotNull(behandlingRepository.hent(sakId))
            call.respond(
                oppdatertBehandling.toSakResponse(
                    soknad = soknad,
                    lagretVedtak = vedtakRepository.hentForBehandling(sakId),
                ),
            )
        }
    }
}

private const val AUTOMATISK_SAKSBEHANDLER = "system"
private const val MAKS_BEGRUNNELSE_TEGN = 1_000
private const val MAKS_BESLUTTET_AV_TEGN = 100

private data class ValidertManuellBeslutningRequest(
    val type: ManuellBeslutning,
    val begrunnelse: String,
    val besluttetAv: String,
)

private fun StartBehandlingRequest.validertSoknadId(): UUID {
    val trimmedSoknadId = soknadId.trim()
    return runCatching { UUID.fromString(trimmedSoknadId) }
        .getOrElse {
            throw ApiValidationException(
                errors =
                    listOf(
                        FieldError(
                            field = "soknadId",
                            message = "soknadId må være en gyldig UUID",
                        ),
                    ),
            )
        }
}

private fun ManuellBeslutningRequest.valider(): ValidertManuellBeslutningRequest {
    val trimmedBegrunnelse = begrunnelse.trim()
    val trimmedBesluttetAv = besluttetAv.trim()
    val errors = mutableListOf<FieldError>()

    if (trimmedBegrunnelse.isBlank()) {
        errors += FieldError(field = "begrunnelse", message = "begrunnelse må fylles ut")
    }
    if (trimmedBegrunnelse.length > MAKS_BEGRUNNELSE_TEGN) {
        errors +=
            FieldError(
                field = "begrunnelse",
                message = "begrunnelse kan maksimalt være $MAKS_BEGRUNNELSE_TEGN tegn",
            )
    }
    if (trimmedBesluttetAv.isBlank()) {
        errors += FieldError(field = "besluttetAv", message = "besluttetAv må fylles ut")
    }
    if (trimmedBesluttetAv.length > MAKS_BESLUTTET_AV_TEGN) {
        errors +=
            FieldError(
                field = "besluttetAv",
                message = "besluttetAv kan maksimalt være $MAKS_BESLUTTET_AV_TEGN tegn",
            )
    }
    if (trimmedBesluttetAv.any(Character::isISOControl)) {
        errors += FieldError(field = "besluttetAv", message = "besluttetAv kan ikke inneholde kontrolltegn")
    }
    if (errors.isNotEmpty()) {
        throw ApiValidationException(
            detail = "Manuell beslutning inneholder ugyldige verdier",
            errors = errors,
        )
    }

    return ValidertManuellBeslutningRequest(
        type = type.toDomain(),
        begrunnelse = trimmedBegrunnelse,
        besluttetAv = trimmedBesluttetAv,
    )
}

private fun ManuellBeslutningTypeDto.toDomain(): ManuellBeslutning =
    when (this) {
        ManuellBeslutningTypeDto.INNVILGELSE -> ManuellBeslutning.INNVILGELSE
        ManuellBeslutningTypeDto.AVSLAG -> ManuellBeslutning.AVSLAG
    }

private fun ApplicationCall.sakId(): Long {
    val rawId = parameters["id"]
    val sakId = rawId?.toLongOrNull()
    if (sakId == null || sakId <= 0) {
        throw ApiValidationException(
            errors =
                listOf(
                    FieldError(
                        field = "id",
                        message = "Sak id må være et positivt heltall",
                    ),
                ),
        )
    }

    return sakId
}

private fun Behandling.venterPaaManuellBeslutning(lagretVedtak: LagretVedtak?): Boolean =
    status == BehandlingStatus.OPPRETTET &&
        lagretVedtak == null &&
        regelspor.any { it.status == RegelStatus.MANUELL_VURDERING }

private fun Soknad.toListeDto(): SoknadListeDto =
    SoknadListeDto(
        id = id.toString(),
        sokerIdent = syntetiskSokerIdent(),
        innsendt = innsendt.toString(),
        termindato = termindato.toString(),
        rettsforhold = rettsforhold.name,
        dekningsgrad = dekningsgrad.name,
        antallBarn = antallBarn,
        oppgittAarsinntektKroner = oppgittAarsinntekt.kroner,
    )

private fun Soknad.toSaksdataDto(): SaksdataDto =
    SaksdataDto(
        id = id.toString(),
        sokerIdent = syntetiskSokerIdent(),
        erNorskBorger = erNorskBorger,
        innsendt = innsendt.toString(),
        termindato = termindato.toString(),
        rettsforhold = rettsforhold.name,
        dekningsgrad = dekningsgrad.name,
        antallBarn = antallBarn,
        oppgittAarsinntektKroner = oppgittAarsinntekt.kroner,
        inntekter =
            inntekter.map {
                InntektDto(
                    maned = it.maned.toString(),
                    type = it.type.name,
                    belopKroner = it.belop.kroner,
                )
            },
    )

private fun Soknad.syntetiskSokerIdent(): String = "TEST-${fnr.takeLast(4)}"

private fun Behandling.toResultatResponse(
    lagretVedtak: LagretVedtak?,
    manuellVurdering: Vedtak.ManuellVurdering?,
): BehandlingResultatResponse =
    BehandlingResultatResponse(
        sakId = id,
        soknadId = soknadId.toString(),
        status = sakStatus(lagretVedtak),
        vedtaksvariant = lagretVedtak?.vedtak?.variantDto() ?: VedtaksvariantDto.MANUELL_VURDERING,
        regelspor = regelspor.map { it.toDto() },
        vedtak = lagretVedtak?.toDto(),
        manuellVurdering = manuellVurdering?.toDto() ?: manuellVurderingFraRegelspor(),
    )

private fun Behandling.toSakResponse(
    soknad: Soknad,
    lagretVedtak: LagretVedtak?,
): SakResponse =
    SakResponse(
        sakId = id,
        soknad = soknad.toSaksdataDto(),
        status = sakStatus(lagretVedtak),
        opprettetTidspunkt = opprettetTidspunkt.toString(),
        ferdigstiltTidspunkt = ferdigstiltTidspunkt?.toString(),
        regelspor = regelspor.map { it.toDto() },
        vedtak = lagretVedtak?.toDto(),
        manuellVurdering = if (lagretVedtak == null) manuellVurderingFraRegelspor() else null,
    )

private fun Behandling.sakStatus(lagretVedtak: LagretVedtak?): SakStatusDto =
    when {
        lagretVedtak != null || status == BehandlingStatus.FERDIGSTILT -> SakStatusDto.FERDIGSTILT
        regelspor.any { it.status == RegelStatus.MANUELL_VURDERING } -> SakStatusDto.TIL_MANUELL_VURDERING
        else -> SakStatusDto.OPPRETTET
    }

private fun Behandling.manuellVurderingFraRegelspor(): ManuellVurderingDto? =
    regelspor
        .firstOrNull { it.status == RegelStatus.MANUELL_VURDERING }
        ?.let { ManuellVurderingDto(grunn = it.begrunnelse) }

private fun Regelresultat.toDto(): RegelresultatDto =
    RegelresultatDto(
        regel = regel.name,
        status = status.name,
        begrunnelse = begrunnelse,
    )

private fun Vedtak.ManuellVurdering.toDto(): ManuellVurderingDto = ManuellVurderingDto(grunn = grunn)

private fun LagretVedtak.toDto(): VedtakDto {
    val vedtakDto = vedtak.toDto(begrunnelse)
    return vedtakDto.copy(
        besluttetAv = besluttetAv,
        besluttetTidspunkt = besluttetTidspunkt.toString(),
    )
}

private fun Vedtak.toDto(begrunnelse: String): VedtakDto =
    when (this) {
        is Vedtak.Innvilget ->
            VedtakDto(
                variant = VedtaksvariantDto.INNVILGET,
                begrunnelse = begrunnelse,
                belopKroner = belop.kroner,
                stonadsperiode =
                    StonadsperiodeDto(
                        fom = stonadsperiode.periode.fra.toString(),
                        tom = stonadsperiode.periode.til.toString(),
                        uker = stonadsperiode.totalUker.antall,
                    ),
                kvoter =
                    KvoterDto(
                        modrekvoteUker = kvoter.modrekvote.antall,
                        fedrekvoteUker = kvoter.fedrekvote.antall,
                        fellesperiodeUker = kvoter.fellesperiode.antall,
                        bonusuker = kvoter.bonusuker.antall,
                        forskuddUker = kvoter.forskuddUker.antall,
                        totalUker = kvoter.total.antall,
                    ),
            )

        is Vedtak.Avslag ->
            VedtakDto(
                variant = VedtaksvariantDto.AVSLAG,
                begrunnelse = begrunnelse,
            )

        is Vedtak.Engangsstonad ->
            VedtakDto(
                variant = VedtaksvariantDto.ENGANGSSTONAD,
                begrunnelse = begrunnelse,
                belopKroner = belop.kroner,
            )

        is Vedtak.ManuellVurdering ->
            VedtakDto(
                variant = VedtaksvariantDto.MANUELL_VURDERING,
                begrunnelse = begrunnelse,
            )
    }

private fun Vedtak.variantDto(): VedtaksvariantDto =
    when (this) {
        is Vedtak.Innvilget -> VedtaksvariantDto.INNVILGET
        is Vedtak.Avslag -> VedtaksvariantDto.AVSLAG
        is Vedtak.Engangsstonad -> VedtaksvariantDto.ENGANGSSTONAD
        is Vedtak.ManuellVurdering -> VedtaksvariantDto.MANUELL_VURDERING
    }
