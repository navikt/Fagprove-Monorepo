package no.nav.fagprove.domain

import java.time.LocalDate
import java.util.UUID

data class Soknad(
    val id: UUID = UUID.randomUUID(),
    val fnr: String,
    val erNorskBorger: Boolean,
    val inntekter: List<Inntektsregistrering>,
    val stonadsperiode: Periode,
    val innsendt: LocalDate,
) {
    init {
        require(fnr.length == 11) { "Fødselsnummer må være 11 siffer" }
        require(fnr.all { it.isDigit() }) { "Fødselsnummer kan kun inneholde siffer" }
    }
}
