package no.nav.fagprove.repository

import no.nav.fagprove.domain.Kvoter
import no.nav.fagprove.domain.Penger
import no.nav.fagprove.domain.Periode
import no.nav.fagprove.domain.Stonadsperiode
import no.nav.fagprove.domain.Uker
import no.nav.fagprove.domain.Vedtak
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.statements.UpdateBuilder

internal fun Vedtak.begrunnelseForLagring(): String =
    when (this) {
        is Vedtak.Innvilget -> begrunnelse
        is Vedtak.Avslag -> begrunnelse
        is Vedtak.Engangsstonad -> begrunnelse
        is Vedtak.ManuellVurdering -> grunn
    }

internal fun UpdateBuilder<*>.setVedtakColumns(vedtak: Vedtak) {
    this[VedtakTable.type] = vedtak.typeForLagring()
    this[VedtakTable.begrunnelse] = vedtak.begrunnelseForLagring()

    when (vedtak) {
        is Vedtak.Innvilget -> {
            this[VedtakTable.belopKroner] = vedtak.belop.kroner
            this[VedtakTable.beregningsgrunnlagKroner] = null
            this[VedtakTable.stonadsperiodeFom] = vedtak.stonadsperiode.periode.fra
            this[VedtakTable.stonadsperiodeTom] = vedtak.stonadsperiode.periode.til
            this[VedtakTable.stonadsperiodeUker] = vedtak.stonadsperiode.totalUker.antall
            this[VedtakTable.modrekvoteUker] = vedtak.kvoter.modrekvote.antall
            this[VedtakTable.fedrekvoteUker] = vedtak.kvoter.fedrekvote.antall
            this[VedtakTable.fellesperiodeUker] = vedtak.kvoter.fellesperiode.antall
            this[VedtakTable.bonusuker] = vedtak.kvoter.bonusuker.antall
            this[VedtakTable.forskuddUker] = vedtak.kvoter.forskuddUker.antall
        }

        is Vedtak.Engangsstonad -> {
            this[VedtakTable.belopKroner] = vedtak.belop.kroner
        }

        is Vedtak.Avslag,
        is Vedtak.ManuellVurdering,
        -> Unit
    }
}

internal fun ResultRow.toLagretVedtak(): LagretVedtak =
    LagretVedtak(
        behandlingId = this[VedtakTable.behandlingId].value,
        vedtak = toVedtak(),
        begrunnelse = this[VedtakTable.begrunnelse],
        besluttetAv = this[VedtakTable.besluttetAv],
        besluttetTidspunkt = this[VedtakTable.besluttetTidspunkt],
    )

private fun Vedtak.typeForLagring(): VedtakType =
    when (this) {
        is Vedtak.Innvilget -> VedtakType.INNVILGET
        is Vedtak.Avslag -> VedtakType.AVSLAG
        is Vedtak.Engangsstonad -> VedtakType.ENGANGSSTONAD
        is Vedtak.ManuellVurdering -> VedtakType.MANUELL_VURDERING
    }

private fun ResultRow.toVedtak(): Vedtak =
    when (this[VedtakTable.type]) {
        VedtakType.INNVILGET ->
            Vedtak.Innvilget(
                belop = Penger(required(VedtakTable.belopKroner)),
                stonadsperiode =
                    Stonadsperiode(
                        periode =
                            Periode(
                                fra = required(VedtakTable.stonadsperiodeFom),
                                til = required(VedtakTable.stonadsperiodeTom),
                            ),
                        totalUker = Uker(required(VedtakTable.stonadsperiodeUker)),
                    ),
                kvoter =
                    Kvoter(
                        modrekvote = Uker(required(VedtakTable.modrekvoteUker)),
                        fedrekvote = Uker(required(VedtakTable.fedrekvoteUker)),
                        fellesperiode = Uker(required(VedtakTable.fellesperiodeUker)),
                        bonusuker = Uker(required(VedtakTable.bonusuker)),
                        forskuddUker = Uker(required(VedtakTable.forskuddUker)),
                        total = Uker(required(VedtakTable.stonadsperiodeUker)),
                    ),
                begrunnelse = this[VedtakTable.begrunnelse],
            )

        VedtakType.AVSLAG ->
            Vedtak.Avslag(
                begrunnelse = this[VedtakTable.begrunnelse],
            )

        VedtakType.ENGANGSSTONAD ->
            Vedtak.Engangsstonad(
                belop = Penger(required(VedtakTable.belopKroner)),
                begrunnelse = this[VedtakTable.begrunnelse],
            )

        VedtakType.MANUELL_VURDERING ->
            Vedtak.ManuellVurdering(
                grunn = this[VedtakTable.begrunnelse],
            )
    }

private fun <T : Any> ResultRow.required(column: org.jetbrains.exposed.v1.core.Column<T?>): T =
    requireNotNull(this[column]) { "Vedtak ${this[VedtakTable.behandlingId].value} mangler ${column.name}" }
