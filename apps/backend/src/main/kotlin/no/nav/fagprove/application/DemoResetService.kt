package no.nav.fagprove.application

import no.nav.fagprove.repository.BehandlingRepository

/**
 * Demo-verktøy for fagprøven: nullstiller saksbehandlingsdata slik at presentatøren kan
 * kjøre scenariene på nytt. Sletter alle behandlinger (med vedtak, regelspor og interne
 * merknader) og seeder søknadene på nytt, slik at hver søknad blir ubehandlet igjen.
 *
 * Endepunktet som bruker denne tjenesten er kun aktivt i dev/PR-miljøer
 * (se [no.nav.fagprove.config.AppConfig.demoResetEnabled]).
 */
class DemoResetService(
    private val behandlingRepository: BehandlingRepository,
    private val reseed: () -> Int,
) {
    fun reset(): DemoResetResultat {
        behandlingRepository.slettAlle()
        val antallSoknader = reseed()
        return DemoResetResultat(antallSoknader = antallSoknader)
    }
}

data class DemoResetResultat(
    val antallSoknader: Int,
)
