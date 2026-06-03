package no.nav.fagprove.repository

import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

internal fun <T> inRepositoryTransaction(
    database: Database?,
    statement: () -> T,
): T =
    if (database == null) {
        transaction { statement() }
    } else {
        transaction(database) { statement() }
    }
