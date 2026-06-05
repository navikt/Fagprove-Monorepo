package no.nav.fagprove.seed

import no.nav.fagprove.domain.Dekningsgrad
import no.nav.fagprove.domain.InntektsType
import no.nav.fagprove.domain.Inntektsregistrering
import no.nav.fagprove.domain.Penger
import no.nav.fagprove.domain.Rettsforhold
import no.nav.fagprove.domain.Soknad
import no.nav.fagprove.repository.SoknadRepository
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

object TestSoknader {
    val innvilgetId: UUID = UUID.fromString("00000000-0000-0000-0000-000000000201")
    val avslagId: UUID = UUID.fromString("00000000-0000-0000-0000-000000000202")
    val engangsstonadId: UUID = UUID.fromString("00000000-0000-0000-0000-000000000203")
    val manuellVurderingId: UUID = UUID.fromString("00000000-0000-0000-0000-000000000204")
    val grensefallTjuefemProsentAvvikId: UUID = UUID.fromString("00000000-0000-0000-0000-000000000205")

    private val innsendt = LocalDate.of(2026, 6, 15)
    private val termindato = LocalDate.of(2026, 8, 1)

    val alle: List<Soknad> =
        listOf(
            Soknad(
                id = innvilgetId,
                fnr = "00000000001",
                erNorskBorger = true,
                inntekter =
                    inntektshistorikk(
                        januar = 47_000,
                        februar = 49_000,
                        mars = 52_000,
                        april = 54_000,
                        mai = 54_000,
                        juni = 54_000,
                    ),
                termindato = termindato,
                rettsforhold = Rettsforhold.BEGGE_FORELDRE,
                dekningsgrad = Dekningsgrad.HUNDRE_PROSENT,
                antallBarn = 1,
                oppgittAarsinntekt = Penger(648_000),
                innsendt = innsendt,
            ),
            Soknad(
                id = avslagId,
                fnr = "00000000002",
                erNorskBorger = false,
                inntekter = inntektshistorikk(),
                termindato = termindato,
                rettsforhold = Rettsforhold.BEGGE_FORELDRE,
                dekningsgrad = Dekningsgrad.HUNDRE_PROSENT,
                antallBarn = 1,
                oppgittAarsinntekt = Penger(600_000),
                innsendt = innsendt,
            ),
            Soknad(
                id = engangsstonadId,
                fnr = "00000000003",
                erNorskBorger = true,
                inntekter =
                    listOf(
                        inntekt(YearMonth.of(2026, 1), 42_000),
                        inntekt(YearMonth.of(2026, 2), 43_000),
                        inntekt(YearMonth.of(2026, 3), 44_000),
                        inntekt(YearMonth.of(2026, 4), 45_000),
                        inntekt(YearMonth.of(2026, 5), 46_000),
                    ),
                termindato = termindato,
                rettsforhold = Rettsforhold.BEGGE_FORELDRE,
                dekningsgrad = Dekningsgrad.HUNDRE_PROSENT,
                antallBarn = 1,
                oppgittAarsinntekt = Penger(540_000),
                innsendt = innsendt,
            ),
            Soknad(
                id = manuellVurderingId,
                fnr = "00000000004",
                erNorskBorger = true,
                inntekter = inntektshistorikk(),
                termindato = termindato,
                rettsforhold = Rettsforhold.BEGGE_FORELDRE,
                dekningsgrad = Dekningsgrad.HUNDRE_PROSENT,
                antallBarn = 1,
                oppgittAarsinntekt = Penger(400_000),
                innsendt = innsendt,
            ),
            Soknad(
                id = grensefallTjuefemProsentAvvikId,
                fnr = "00000000005",
                erNorskBorger = true,
                inntekter = inntektshistorikk(),
                termindato = termindato,
                rettsforhold = Rettsforhold.BEGGE_FORELDRE,
                dekningsgrad = Dekningsgrad.HUNDRE_PROSENT,
                antallBarn = 1,
                // 50 000 kr i april-juni gir 600 000 kr beregnet årsinntekt.
                // Oppgitt 480 000 kr er nøyaktig 25 % lavere og skal ikke gi manuell vurdering.
                oppgittAarsinntekt = Penger(480_000),
                innsendt = innsendt,
            ),
        )

    private fun inntektshistorikk(
        januar: Int = 50_000,
        februar: Int = 50_000,
        mars: Int = 50_000,
        april: Int = 50_000,
        mai: Int = 50_000,
        juni: Int = 50_000,
    ): List<Inntektsregistrering> =
        listOf(
            inntekt(YearMonth.of(2026, 1), januar),
            inntekt(YearMonth.of(2026, 2), februar, InntektsType.SYKEPENGER),
            inntekt(YearMonth.of(2026, 3), mars),
            inntekt(YearMonth.of(2026, 4), april),
            inntekt(YearMonth.of(2026, 5), mai, InntektsType.FORELDREPENGER),
            inntekt(YearMonth.of(2026, 6), juni),
        )

    private fun inntekt(
        maned: YearMonth,
        kroner: Int,
        type: InntektsType = InntektsType.ARBEID,
    ) = Inntektsregistrering(
        maned = maned,
        type = type,
        belop = Penger(kroner),
    )
}

class TestSoknadSeeder(
    private val soknadRepository: SoknadRepository,
) {
    fun seed(): List<Soknad> = TestSoknader.alle.map { soknadRepository.lagre(it) }
}
