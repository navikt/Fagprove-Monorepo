import {
  formatRegelStatus,
  type RegelStatus,
  type RegelresultatDto,
  type SakResponse,
  type Vedtaksvariant,
} from '../../lib/foreldrepenger';

export type SakTagVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type ModerateTagVariant =
  | 'success-moderate'
  | 'warning-moderate'
  | 'error-moderate'
  | 'info-moderate';

export function getSakTagVariant(sak: SakResponse): SakTagVariant {
  if (sak.status === 'TIL_MANUELL_VURDERING') {
    return 'warning';
  }
  if (sak.vedtak?.variant === 'AVSLAG') {
    return 'error';
  }
  if (sak.vedtak?.variant === 'INNVILGET' || sak.vedtak?.variant === 'ENGANGSSTONAD') {
    return 'success';
  }
  if (sak.status === 'OPPRETTET') {
    return 'info';
  }

  return 'neutral';
}

export function getVedtaksTagVariant(variant?: Vedtaksvariant): ModerateTagVariant {
  if (variant === 'AVSLAG') {
    return 'error-moderate';
  }
  if (variant === 'MANUELL_VURDERING') {
    return 'warning-moderate';
  }
  if (variant === 'INNVILGET' || variant === 'ENGANGSSTONAD') {
    return 'success-moderate';
  }
  return 'info-moderate';
}

export function getRegelStatusTagVariant(status: RegelStatus): ModerateTagVariant {
  if (status === 'IKKE_OPPFYLT') {
    return 'error-moderate';
  }
  if (status === 'MANUELL_VURDERING') {
    return 'warning-moderate';
  }
  return 'success-moderate';
}

export function formatUker(uker: number): string {
  return `${uker} ${uker === 1 ? 'uke' : 'uker'}`;
}

export function getOpptjeningStatus(sak: SakResponse): string {
  const opptjening = sak.regelspor.find((regel) => regel.regel === 'OPPTJENING');

  return opptjening ? formatRegelStatus(opptjening.status) : 'Ikke vurdert';
}

export function getRuleDetailLabel(regel: RegelresultatDto): string {
  const labels: Record<string, string> = {
    OPPTJENING: 'Opptjeningskrav',
    BEREGNINGSGRUNNLAG: 'Beregningsgrunnlag',
    ENGANGSSTONAD: 'Fallback',
    STONADSPERIODE: 'Stønadsperiode',
    KVOTEFORDELING: 'Kvote',
  };

  if (regel.status === 'MANUELL_VURDERING') {
    return 'Aktiv';
  }

  return labels[regel.regel] ?? 'Regelvurdering';
}

export function getManualReason(sak: SakResponse): string | undefined {
  return (
    sak.manuellVurdering?.grunn ??
    sak.regelspor.find((regel) => regel.status === 'MANUELL_VURDERING')?.begrunnelse
  );
}
