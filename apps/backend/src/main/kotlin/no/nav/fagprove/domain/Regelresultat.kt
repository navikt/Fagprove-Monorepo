package no.nav.fagprove.domain

data class Regelresultat(
    val regel: Regelnavn,
    val status: RegelStatus,
    val begrunnelse: String,
)

enum class Regelnavn {
    OPPTJENING,
    ENGANGSSTONAD,
    BEREGNINGSGRUNNLAG,
    STONADSPERIODE,
    KVOTEFORDELING,
}

enum class RegelStatus {
    OPPFYLT,
    IKKE_OPPFYLT,
    MANUELL_VURDERING,
}
