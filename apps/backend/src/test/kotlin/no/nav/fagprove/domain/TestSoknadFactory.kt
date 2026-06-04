package no.nav.fagprove.domain

import java.time.LocalDate
import java.time.YearMonth

internal fun testInntekt(
    maned: YearMonth,
    kroner: Int = 50_000,
    type: InntektsType = InntektsType.ARBEID,
) = Inntektsregistrering(
    maned = maned,
    type = type,
    belop = Penger(kroner),
)

internal fun testSoknad(
    erNorskBorger: Boolean = true,
    inntekter: List<Inntektsregistrering> = seksTellendeInntekter(),
    termindato: LocalDate = LocalDate.of(2026, 8, 1),
    rettsforhold: Rettsforhold = Rettsforhold.BEGGE_FORELDRE,
    dekningsgrad: Dekningsgrad = Dekningsgrad.HUNDRE_PROSENT,
    antallBarn: Int = 1,
    oppgittAarsinntekt: Penger = Penger(600_000),
    innsendt: LocalDate = LocalDate.of(2026, 6, 15),
    beskrivelse: String? = null,
) = Soknad(
    fnr = "12345678901",
    erNorskBorger = erNorskBorger,
    inntekter = inntekter,
    termindato = termindato,
    rettsforhold = rettsforhold,
    dekningsgrad = dekningsgrad,
    antallBarn = antallBarn,
    oppgittAarsinntekt = oppgittAarsinntekt,
    innsendt = innsendt,
    beskrivelse = beskrivelse,
)

internal fun seksTellendeInntekter(
    kroner: Int = 50_000,
    slutt: YearMonth = YearMonth.of(2026, 5),
) = (0L..5L).map { offset ->
    testInntekt(
        maned = slutt.minusMonths(offset),
        kroner = kroner,
    )
}

internal fun inntekterSisteTreManeder(
    kroner: Int = 50_000,
    slutt: YearMonth = YearMonth.of(2026, 5),
) = (0L..2L).map { offset ->
    testInntekt(
        maned = slutt.minusMonths(offset),
        kroner = kroner,
    )
}

internal fun testStonadsperiode(totalUker: Int = 49) =
    Stonadsperiode(
        periode =
            Periode(
                fra = LocalDate.of(2026, 7, 11),
                til = LocalDate.of(2027, 6, 18),
            ),
        totalUker = Uker(totalUker),
    )

internal fun testKvoter(totalUker: Int = 49) =
    Kvoter(
        modrekvote = Uker(15),
        fedrekvote = Uker(15),
        fellesperiode = Uker(totalUker - 33),
        bonusuker = Uker(0),
        forskuddUker = Uker(3),
        total = Uker(totalUker),
    )
