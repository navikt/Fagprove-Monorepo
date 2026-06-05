package no.nav.fagprove.domain

enum class InntektsType {
    ARBEID,
    SYKEPENGER,
    FORELDREPENGER,
    SVANGERSKAPSPENGER,
    DAGPENGER,
    AAP,
    PLEIEPENGER,
    STIPEND_LANEKASSEN,
    ;

    companion object {
        // Godkjent inntekt etter §§ 2-1 og 14-6. STIPEND_LANEKASSEN er ikke pensjonsgivende
        // og teller derfor hverken for opptjening eller beregningsgrunnlag.
        val GODKJENTE: Set<InntektsType> =
            setOf(
                ARBEID,
                SYKEPENGER,
                FORELDREPENGER,
                SVANGERSKAPSPENGER,
                DAGPENGER,
                AAP,
                PLEIEPENGER,
            )
    }
}
