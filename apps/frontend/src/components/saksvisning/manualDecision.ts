import { type SakResponse } from '../../lib/foreldrepenger';

export const DEMO_BESLUTTET_AV = 'Kari Saksbehandler';
export const MAKS_BEGRUNNELSE_TEGN = 1_000;

export function shouldShowManualDecision(sak: SakResponse): boolean {
  return sak.status === 'TIL_MANUELL_VURDERING' && Boolean(sak.manuellVurdering) && !sak.vedtak;
}
