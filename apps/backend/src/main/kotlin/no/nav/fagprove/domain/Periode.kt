package no.nav.fagprove.domain

import java.time.LocalDate

data class Periode(
    val fra: LocalDate,
    val til: LocalDate,
) {
    init {
        require(!fra.isAfter(til)) { "fra ($fra) kan ikke være etter til ($til)" }
    }
}
