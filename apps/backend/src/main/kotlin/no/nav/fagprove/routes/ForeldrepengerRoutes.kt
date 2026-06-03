package no.nav.fagprove.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import no.nav.fagprove.domain.ManuellBeslutning
import no.nav.fagprove.domain.RegelStatus
import no.nav.fagprove.domain.Regelresultat
import no.nav.fagprove.domain.Saksbehandling
import no.nav.fagprove.domain.Soknad
import no.nav.fagprove.domain.Vedtak
import no.nav.fagprove.dto.BehandlingResultatResponse
import no.nav.fagprove.dto.ErrorResponse
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
            val soknadId = request.soknadId.toUuidOrBadRequest("soknadId")
            val soknad =
                soknadRepository.hent(soknadId)
                    ?: return@post call.respondNotFound("Søknad $soknadId finnes ikke")

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
            val sakId = call.sakId() ?: return@get
            val behandling =
                behandlingRepository.hent(sakId)
                    ?: return@get call.respondNotFound("Sak $sakId finnes ikke")
            val soknad =
                soknadRepository.hent(behandling.soknadId)
                    ?: return@get call.respondNotFound("Søknad ${behandling.soknadId} finnes ikke")

            call.respond(
                behandling.toSakResponse(
                    soknad = soknad,
                    lagretVedtak = vedtakRepository.hentForBehandling(sakId),
                ),
            )
        }

        post("/saker/{id}/beslutning") {
            val sakId = call.sakId() ?: return@post
            val request = call.receive<ManuellBeslutningRequest>()
            request.valider()

            val behandling =
                behandlingRepository.hent(sakId)
                    ?: return@post call.respondNotFound("Sak $sakId finnes ikke")
            val soknad =
                soknadRepository.hent(behandling.soknadId)
                    ?: return@post call.respondNotFound("Søknad ${behandling.soknadId} finnes ikke")

            if (!behandling.venterPaaManuellBeslutning(vedtakRepository.hentForBehandling(sakId))) {
                return@post call.respondConflict("Sak $sakId venter ikke på manuell beslutning")
            }

            val vedtak =
                Saksbehandling.besluttManuelt(
                    soknad = soknad,
                    beslutning = request.type.toDomain(),
                    begrunnelse = request.begrunnelse.trim(),
                )
            vedtakRepository.lagre(
                behandlingId = sakId,
                vedtak = vedtak,
                besluttetAv = request.besluttetAv.trim(),
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

private fun String.toUuidOrBadRequest(fieldName: String): UUID =
    runCatching { UUID.fromString(this) }
        .getOrElse { throw IllegalArgumentException("$fieldName må være en gyldig UUID") }

private fun ManuellBeslutningRequest.valider() {
    require(begrunnelse.isNotBlank()) { "begrunnelse må fylles ut" }
    require(besluttetAv.isNotBlank()) { "besluttetAv må fylles ut" }
    require(besluttetAv.length <= 100) { "besluttetAv kan maksimalt være 100 tegn" }
}

private fun ManuellBeslutningTypeDto.toDomain(): ManuellBeslutning =
    when (this) {
        ManuellBeslutningTypeDto.INNVILGELSE -> ManuellBeslutning.INNVILGELSE
        ManuellBeslutningTypeDto.AVSLAG -> ManuellBeslutning.AVSLAG
    }

private suspend fun ApplicationCall.sakId(): Long? {
    val rawId = parameters["id"]
    val sakId = rawId?.toLongOrNull()
    if (sakId == null || sakId <= 0) {
        respond(
            HttpStatusCode.BadRequest,
            ErrorResponse(
                title = "Bad Request",
                status = 400,
                detail = "Sak id må være et positivt heltall",
            ),
        )
        return null
    }

    return sakId
}

private suspend fun ApplicationCall.respondNotFound(detail: String) {
    respond(
        HttpStatusCode.NotFound,
        ErrorResponse(
            title = "Not Found",
            status = 404,
            detail = detail,
        ),
    )
}

private suspend fun ApplicationCall.respondConflict(detail: String) {
    respond(
        HttpStatusCode.Conflict,
        ErrorResponse(
            title = "Conflict",
            status = 409,
            detail = detail,
        ),
    )
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
