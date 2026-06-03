package no.nav.fagprove.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.metrics.micrometer.*
import io.ktor.server.plugins.callid.*
import io.ktor.server.plugins.calllogging.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.micrometer.prometheusmetrics.*
import org.slf4j.event.Level
import java.util.UUID

fun Application.configureMonitoring() {
    val appMicrometerRegistry = PrometheusMeterRegistry(PrometheusConfig.DEFAULT)
    install(MicrometerMetrics) {
        registry = appMicrometerRegistry
    }
    install(CallId) {
        header(HttpHeaders.XRequestId)
        generate { UUID.randomUUID().toString() }
        verify { callId: String ->
            callId.isNotEmpty()
        }
    }
    install(CallLogging) {
        level = Level.INFO
        callIdMdc("call-id")
    }
    routing {
        route("/internal") {
            get("/metrics") {
                call.respond(appMicrometerRegistry.scrape())
            }
        }
    }
}
