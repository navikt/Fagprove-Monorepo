package no.nav.fagprove

import io.ktor.server.application.*
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

    when {
        config.syncExternalSoknader -> {
            val synkroniserteSoknader =
                DigisisSoknadSeeder(
                    soknadRepository = soknadRepository,
                    digisisSoknadClient = digisisSoknadClientFactory(config),
                ).seed()
            log.info("Synkroniserte ${synkroniserteSoknader.size} Digisis-testsøknader")
        }
        config.seedTestSoknader -> {
            val seededeSoknader = TestSoknadSeeder(soknadRepository).seed()
            log.info("Seedet ${seededeSoknader.size} deterministiske testsøknader")
        }
    }

    configureHTTP()
    val enforceForeldrepengerAuth = configureAuthentication()
    configureSerialization()
    configureMonitoring()
    configureRouting(
        database = database,
        enforceForeldrepengerAuth = enforceForeldrepengerAuth,
    )
}
