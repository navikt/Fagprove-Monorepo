package no.nav.fagprove.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import no.nav.fagprove.domain.City
import no.nav.fagprove.dto.CityResponse
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

class CityRepository(
    database: Database,
    createSchema: Boolean = true,
) {
    object Cities : Table() {
        val id = integer("id").autoIncrement()
        val name = varchar("name", length = 255)
        val population = integer("population")

        override val primaryKey = PrimaryKey(id)
    }

    init {
        if (createSchema) {
            transaction(database) {
                SchemaUtils.create(Cities)
            }
        }
    }

    suspend fun create(city: City): Int =
        dbQuery {
            Cities.insert {
                it[name] = city.name
                it[population] = city.population
            }[Cities.id]
        }

    suspend fun findAll(): List<CityResponse> =
        dbQuery {
            Cities.selectAll()
                .map { CityResponse(it[Cities.id], it[Cities.name], it[Cities.population]) }
        }

    suspend fun findById(id: Int): City? =
        dbQuery {
            Cities.selectAll()
                .where { Cities.id eq id }
                .map { City(it[Cities.name], it[Cities.population]) }
                .singleOrNull()
        }

    suspend fun update(
        id: Int,
        city: City,
    ) = dbQuery {
        Cities.update({ Cities.id eq id }) {
            it[name] = city.name
            it[population] = city.population
        }
    }

    suspend fun delete(id: Int) =
        dbQuery {
            Cities.deleteWhere { Cities.id eq id }
        }

    private suspend fun <T> dbQuery(block: suspend () -> T): T =
        withContext(Dispatchers.IO) {
            suspendTransaction { block() }
        }
}
