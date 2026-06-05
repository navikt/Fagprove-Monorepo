package no.nav.fagprove.domain

data class KvoteFordelingResultat(
    val kvoter: Kvoter,
    val regelresultat: Regelresultat,
)

object KvoteFordeler {
    private const val FORSKUDD_UKER = 3

    fun fordel(
        soknad: Soknad,
        stonadsperiode: Stonadsperiode,
    ): KvoteFordelingResultat {
        val total = stonadsperiode.totalUker.antall
        val foreldrekvote = soknad.dekningsgrad.foreldrekvoteUker

        val kvoter =
            when (soknad.rettsforhold) {
                Rettsforhold.BEGGE_FORELDRE -> {
                    val bonusuker = soknad.flerbarnstilleggUker()
                    Kvoter(
                        modrekvote = Uker(foreldrekvote),
                        fedrekvote = Uker(foreldrekvote),
                        fellesperiode = Uker(total - foreldrekvote - foreldrekvote - FORSKUDD_UKER - bonusuker),
                        bonusuker = Uker(bonusuker),
                        forskuddUker = Uker(FORSKUDD_UKER),
                        total = stonadsperiode.totalUker,
                    )
                }

                Rettsforhold.KUN_MOR ->
                    Kvoter(
                        modrekvote = Uker(total - FORSKUDD_UKER),
                        fedrekvote = Uker(0),
                        fellesperiode = Uker(0),
                        bonusuker = Uker(0),
                        forskuddUker = Uker(FORSKUDD_UKER),
                        total = stonadsperiode.totalUker,
                    )

                Rettsforhold.KUN_FAR ->
                    Kvoter(
                        modrekvote = Uker(0),
                        fedrekvote = Uker(total),
                        fellesperiode = Uker(0),
                        bonusuker = Uker(0),
                        forskuddUker = Uker(0),
                        total = stonadsperiode.totalUker,
                    )
            }

        return KvoteFordelingResultat(
            kvoter = kvoter,
            regelresultat =
                Regelresultat(
                    regel = Regelnavn.KVOTEFORDELING,
                    status = RegelStatus.OPPFYLT,
                    begrunnelse = "Kvotene summerer til ${kvoter.total.antall} uker",
                ),
        )
    }
}
