import { getVedtaksvariantLabel, type Vedtaksvariant } from '../../../lib/foreldrepenger';

interface VedtakStatusBannerProps {
  variant?: Vedtaksvariant;
}

export function VedtakStatusBanner({ variant }: VedtakStatusBannerProps) {
  return (
    <div className="decision-status-banner" data-variant={variant ?? 'IKKE_AVKLART'}>
      {variant ? getVedtaksvariantLabel(variant) : 'Ikke avklart'}
    </div>
  );
}
