package no.nav.fagprove

import io.ktor.server.application.*
import no.nav.fagprove.config.AppConfig
import no.nav.fagprove.config.DatabaseFactory
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
    val config = AppConfig.resolve()
    val database = DatabaseFactory.init(this, config)

    if (config.seedTestSoknader) {
        val seededeSoknader = TestSoknadSeeder(SoknadRepository(database)).seed()
        log.info("Seedet ${seededeSoknader.size} deterministiske testsøknader")
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
