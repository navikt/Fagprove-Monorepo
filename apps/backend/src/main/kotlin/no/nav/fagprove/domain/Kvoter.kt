package no.nav.fagprove.domain

data class Kvoter(
    val modrekvote: Uker,
    val fedrekvote: Uker,
    val fellesperiode: Uker,
    val bonusuker: Uker,
    val forskuddUker: Uker,
    val total: Uker,
) {
    init {
        val sum =
            modrekvote.antall +
                fedrekvote.antall +
                fellesperiode.antall +
                bonusuker.antall +
                forskuddUker.antall

        require(sum == total.antall) {
            "Kvotene må summere til total stønadsperiode: $sum != ${total.antall}"
        }
    }
}
