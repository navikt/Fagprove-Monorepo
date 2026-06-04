package no.nav.fagprove.repository

import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import java.util.UUID

internal fun repositoryTestDatabase(): Database {
    val databaseName = "repo_${UUID.randomUUID().toString().replace("-", "")}"
    val database =
        Database.connect(
            url = "jdbc:h2:mem:$databaseName;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
            driver = "org.h2.Driver",
            user = "sa",
            password = "",
        )

    transaction(database) {
        SchemaUtils.create(
            SoknadTable,
            InntektsregistreringTable,
            BehandlingTable,
            RegelresultatTable,
            VedtakTable,
            InternMerknadTable,
        )
    }

    return database
}
