package no.nav.fagprove.config

import org.postgresql.ds.PGSimpleDataSource
import kotlin.test.Test
import kotlin.test.assertIs

class DatabaseFactoryTest {
    @Test
    fun `migration flyway uses explicit PostgreSQL data source without opening a connection`() {
        val flyway =
            DatabaseFactory.migrationFlyway(
                url = "jdbc:postgresql://postgres.local:5432/fagprove",
                user = "app",
                password = "secret",
            )

        assertIs<PGSimpleDataSource>(flyway.configuration.dataSource)
    }
}
