package no.nav.fagprove.external

import kotlinx.serialization.Serializable
import no.nav.fagprove.domain.Dekningsgrad
import no.nav.fagprove.domain.InntektsType
import no.nav.fagprove.domain.Inntektsregistrering
import no.nav.fagprove.domain.Penger
import no.nav.fagprove.domain.Rettsforhold
import no.nav.fagprove.domain.Soknad
import java.nio.charset.StandardCharsets.UTF_8
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeParseException
import java.util.UUID

@Serializable
data class DigisisSoknadDto(
    val id: String,
    val beskrivelse: String,
    val fnr: String,
    val erNorskBorger: Boolean,
    val termindato: String,
    val oppgittArsinntekt: Int,
    val inntektshistorikk: List<DigisisInntektDto>,
    val antallBarn: Int,
    val rettsforhold: String,
    val dekningsgrad: Int,
)

@Serializable
data class DigisisInntektDto(
    val maned: String,
    val type: String,
    val belop: Int,
)

fun DigisisSoknadDto.toSoknad(): Soknad {
    val parsedTermindato = termindato.toLocalDate("termindato")
    val trimmedBeskrivelse = beskrivelse.trim()
    if (id.isBlank()) {
        throw DigisisSoknadMappingException("id må være utfylt")
    }
    if (trimmedBeskrivelse.isBlank()) {
        throw DigisisSoknadMappingException("beskrivelse må være utfylt")
    }
    if (fnr.length != 11 || !fnr.all { it.isDigit() }) {
        throw DigisisSoknadMappingException("fnr må være 11 siffer")
    }

    return Soknad(
        id = deterministicDigisisSoknadId(id),
        fnr = fnr,
        erNorskBorger = erNorskBorger,
        inntekter = inntektshistorikk.map { it.toDomain() },
        termindato = parsedTermindato,
        rettsforhold = rettsforhold.toRettsforhold(),
        dekningsgrad = dekningsgrad.toDekningsgrad(),
        antallBarn = antallBarn,
        oppgittAarsinntekt = Penger(oppgittArsinntekt),
        innsendt = parsedTermindato.minusMonths(2),
        beskrivelse = trimmedBeskrivelse,
    )
}

fun deterministicDigisisSoknadId(externalId: String): UUID =
    UUID.nameUUIDFromBytes("digisis:$externalId".toByteArray(UTF_8))

class DigisisSoknadMappingException(
    message: String,
) : IllegalArgumentException(message)

private fun DigisisInntektDto.toDomain(): Inntektsregistrering =
    Inntektsregistrering(
        maned = maned.toYearMonth(),
        type = type.toInntektsType(),
        belop = Penger(belop),
    )

private fun String.toLocalDate(field: String): LocalDate =
    try {
        LocalDate.parse(this)
    } catch (_: DateTimeParseException) {
        throw DigisisSoknadMappingException("$field må være en ISO-dato")
    }

private fun String.toYearMonth(): YearMonth =
    try {
        YearMonth.parse(this)
    } catch (_: DateTimeParseException) {
        throw DigisisSoknadMappingException("inntektshistorikk.maned må være på formatet YYYY-MM")
    }

private fun String.toInntektsType(): InntektsType =
    try {
        InntektsType.valueOf(trim().uppercase().replace("-", "_"))
    } catch (_: IllegalArgumentException) {
        throw DigisisSoknadMappingException("inntektshistorikk.type er ukjent")
    }

private fun String.toRettsforhold(): Rettsforhold =
    when (trim().lowercase()) {
        "begge" -> Rettsforhold.BEGGE_FORELDRE
        "kun-mor" -> Rettsforhold.KUN_MOR
        "kun-far" -> Rettsforhold.KUN_FAR
        else -> throw DigisisSoknadMappingException("rettsforhold er ukjent")
    }

private fun Int.toDekningsgrad(): Dekningsgrad =
    when (this) {
        100 -> Dekningsgrad.HUNDRE_PROSENT
        80 -> Dekningsgrad.ATTI_PROSENT
        else -> throw DigisisSoknadMappingException("dekningsgrad er ukjent")
    }
