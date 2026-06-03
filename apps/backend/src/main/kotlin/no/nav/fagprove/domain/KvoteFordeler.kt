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
        val bonusuker = soknad.flerbarnstilleggUker()
        val forskuddUker = if (soknad.rettsforhold == Rettsforhold.KUN_FAR) 0 else FORSKUDD_UKER
        val modrekvote = if (soknad.rettsforhold == Rettsforhold.KUN_FAR) 0 else soknad.dekningsgrad.foreldrekvoteUker
        val fedrekvote = if (soknad.rettsforhold == Rettsforhold.KUN_MOR) 0 else soknad.dekningsgrad.foreldrekvoteUker
        val fellesperiode =
            stonadsperiode.totalUker.antall -
                bonusuker -
                forskuddUker -
                modrekvote -
                fedrekvote

        val kvoter =
            Kvoter(
                modrekvote = Uker(modrekvote),
                fedrekvote = Uker(fedrekvote),
                fellesperiode = Uker(fellesperiode),
                bonusuker = Uker(bonusuker),
                forskuddUker = Uker(forskuddUker),
                total = stonadsperiode.totalUker,
            )

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
