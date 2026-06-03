package no.nav.fagprove

import io.ktor.server.application.*
import no.nav.fagprove.config.AppConfig
import no.nav.fagprove.config.DatabaseFactory
import no.nav.fagprove.plugins.configureAuthentication
import no.nav.fagprove.plugins.configureHTTP
import no.nav.fagprove.plugins.configureMonitoring
import no.nav.fagprove.plugins.configureRouting
import no.nav.fagprove.plugins.configureSerialization

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain
        .main(args)
}

fun Application.module() {
    val config = AppConfig.resolve()
    DatabaseFactory.init(this, config)

    configureHTTP()
    configureAuthentication()
    configureSerialization()
    configureMonitoring()
    configureRouting()
}
