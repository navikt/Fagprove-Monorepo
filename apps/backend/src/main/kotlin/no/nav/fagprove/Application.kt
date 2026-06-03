package no.nav.fagprove

import io.ktor.server.application.*
import no.nav.fagprove.config.AppConfig
import no.nav.fagprove.config.DatabaseFactory
import no.nav.fagprove.plugins.configureAuthentication
import no.nav.fagprove.plugins.configureHTTP
import no.nav.fagprove.plugins.configureMonitoring
import no.nav.fagprove.plugins.configureRouting
import no.nav.fagprove.plugins.configureSerialization
import no.nav.fagprove.repository.CityRepository
import no.nav.fagprove.repository.UserRepository
import no.nav.fagprove.service.CityService
import no.nav.fagprove.service.UserService

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain
        .main(args)
}

fun Application.module() {
    // Konfigurasjon
    val config = AppConfig.resolve()
    val database = DatabaseFactory.init(this, config)

    // H2 (InMemory) har ingen Flyway-migrering — da lar vi Exposed lage skjemaet.
    // For PostgreSQL (Testcontainers/External) eier Flyway skjemaet alene.
    val createSchema = config is AppConfig.InMemory

    // Repositories
    val cityRepository = CityRepository(database, createSchema)
    val userRepository = UserRepository(database, createSchema)

    // Tjenester
    val cityService = CityService(cityRepository)
    val userService = UserService(userRepository)

    // Plugins
    configureHTTP()
    configureAuthentication()
    configureSerialization()
    configureMonitoring()
    configureRouting(cityService, userService)
}
