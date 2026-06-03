package no.nav.fagprove.domain

import java.time.YearMonth

data class Inntektsregistrering(
    val maned: YearMonth,
    val type: InntektsType,
    val belop: Penger,
)
