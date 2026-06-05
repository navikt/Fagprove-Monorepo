package no.nav.fagprove

import io.ktor.server.application.*
import no.nav.fagprove.application.DemoResetResultat
import no.nav.fagprove.application.DemoResetService
import no.nav.fagprove.config.AppConfig
import no.nav.fagprove.config.DatabaseFactory
import no.nav.fagprove.external.DigisisSoknadClient
import no.nav.fagprove.external.DigisisSoknadSeeder
import no.nav.fagprove.external.HttpDigisisSoknadClient
import no.nav.fagprove.plugins.configureAuthentication
import no.nav.fagprove.plugins.configureHTTP
import no.nav.fagprove.plugins.configureMonitoring
import no.nav.fagprove.plugins.configureRouting
import no.nav.fagprove.plugins.configureSerialization
import no.nav.fagprove.repository.BehandlingRepository
import no.nav.fagprove.repository.SoknadRepository
import no.nav.fagprove.seed.TestSoknadSeeder

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain
        .main(args)
}

fun Application.module() {
    configureApplication(config = AppConfig.resolve())
}

internal fun Application.configureApplication(
    config: AppConfig,
    digisisSoknadClientFactory: (AppConfig) -> DigisisSoknadClient = {
        HttpDigisisSoknadClient(
            it.digisisSoknadSourceUrl,
        )
    },
) {
    val database = DatabaseFactory.init(this, config)
    val soknadRepository = SoknadRepository(database)
    val behandlingRepository = BehandlingRepository(database)

    val seedSoknader: () -> Int = {
        when {
            config.syncExternalSoknader ->
                DigisisSoknadSeeder(
                    soknadRepository = soknadRepository,
                    digisisSoknadClient = digisisSoknadClientFactory(config),
                ).seed().size
            config.seedTestSoknader ->
                TestSoknadSeeder(soknadRepository).seed().size
            else -> 0
        }
    }

    val antallSeedede = seedSoknader()
    when {
        config.syncExternalSoknader -> log.info("Synkroniserte $antallSeedede Digisis-testsøknader")
        config.seedTestSoknader -> log.info("Seedet $antallSeedede deterministiske testsøknader")
    }

    val demoReset: (() -> DemoResetResultat)? =
        if (config.demoResetEnabled) {
            val demoResetService =
                DemoResetService(
                    behandlingRepository = behandlingRepository,
                    reseed = seedSoknader,
                )
            log.warn("Demo-nullstilling er AKTIVERT (POST /api/v1/foreldrepenger/demo/reset)")
            demoResetService::reset
        } else {
            null
        }

    configureHTTP()
    val enforceForeldrepengerAuth = configureAuthentication()
    configureSerialization()
    configureMonitoring()
    configureRouting(
        database = database,
        enforceForeldrepengerAuth = enforceForeldrepengerAuth,
        demoReset = demoReset,
    )
}
