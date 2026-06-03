package no.nav.fagprove.domain

data class Kvoter(
    val modrekvote: Periode,
    val fedrekvote: Periode,
    val fellesperiode: Periode,
)
