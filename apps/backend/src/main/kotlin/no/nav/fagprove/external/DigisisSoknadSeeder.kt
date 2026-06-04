package no.nav.fagprove.external

import no.nav.fagprove.domain.Soknad
import no.nav.fagprove.repository.SoknadRepository

class DigisisSoknadSeeder(
    private val soknadRepository: SoknadRepository,
    private val digisisSoknadClient: DigisisSoknadClient,
) {
    fun seed(): List<Soknad> {
        val soknader =
            digisisSoknadClient
                .hentSoknader()
                .mapIndexed { index, dto -> dto.toSoknad(index) }

        return soknader.map { soknadRepository.lagre(it) }
    }

    private fun DigisisSoknadDto.toSoknad(index: Int): Soknad =
        try {
            toSoknad()
        } catch (cause: DigisisSoknadMappingException) {
            throw DigisisSoknadMappingException(
                "Digisis-søknad på indeks ${index + 1} er ugyldig: ${cause.message}",
            )
        } catch (_: IllegalArgumentException) {
            throw DigisisSoknadMappingException(
                "Digisis-søknad på indeks ${index + 1} er ugyldig",
            )
        }
}
