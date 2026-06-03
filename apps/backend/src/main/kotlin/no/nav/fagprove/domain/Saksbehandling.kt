package no.nav.fagprove.domain

data class Saksbehandlingsresultat(
    val vedtak: Vedtak,
    val regelspor: List<Regelresultat>,
)

enum class ManuellBeslutning {
    INNVILGELSE,
    AVSLAG,
}

object Saksbehandling {
    fun behandle(soknad: Soknad): Saksbehandlingsresultat {
        val regelspor = mutableListOf<Regelresultat>()

        val opptjening = Opptjeningsvurderer.vurder(soknad)
        regelspor += opptjening.regelresultat

        if (!opptjening.oppfylt) {
            val fallback = EngangsstonadFallback.vurder(soknad)
            regelspor += fallback.regelresultat
            return Saksbehandlingsresultat(
                vedtak = fallback.vedtak,
                regelspor = regelspor,
            )
        }

        val beregning = BeregningsgrunnlagBeregner.beregn(soknad)
        regelspor += beregning.regelresultat

        val grunnlag = beregning.grunnlag
        if (grunnlag is Grunnlag.ManuellVurdering) {
            return Saksbehandlingsresultat(
                vedtak = Vedtak.ManuellVurdering(grunnlag.grunn),
                regelspor = regelspor,
            )
        }

        require(grunnlag is Grunnlag.OK) { "Beregningsgrunnlag må være OK for innvilgelse" }

        val stonadsperiode = StonadsperiodeOppslag.finn(soknad)
        regelspor += stonadsperiode.regelresultat

        val kvoter = KvoteFordeler.fordel(soknad, stonadsperiode.stonadsperiode)
        regelspor += kvoter.regelresultat

        return Saksbehandlingsresultat(
            vedtak =
                Vedtak.Innvilget(
                    belop = grunnlag.belop,
                    stonadsperiode = stonadsperiode.stonadsperiode,
                    kvoter = kvoter.kvoter,
                ),
            regelspor = regelspor,
        )
    }

    fun besluttManuelt(
        soknad: Soknad,
        beslutning: ManuellBeslutning,
        begrunnelse: String,
    ): Vedtak =
        when (beslutning) {
            ManuellBeslutning.AVSLAG ->
                Vedtak.Avslag(begrunnelse = begrunnelse)

            ManuellBeslutning.INNVILGELSE -> {
                val stonadsperiode = StonadsperiodeOppslag.finn(soknad).stonadsperiode
                val kvoter = KvoteFordeler.fordel(soknad, stonadsperiode).kvoter

                Vedtak.Innvilget(
                    belop = BeregningsgrunnlagBeregner.avgrensTilMaksYtelse(soknad.oppgittAarsinntekt),
                    stonadsperiode = stonadsperiode,
                    kvoter = kvoter,
                    begrunnelse = begrunnelse,
                )
            }
        }
}
