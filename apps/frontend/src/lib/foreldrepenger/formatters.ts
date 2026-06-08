import type { RegelStatus, SakStatus, SoknadListeDto, VedtakDto, Vedtaksvariant } from './types';

interface SeedPresentation {
  sakLabel: string;
  scenario: string;
  applicantName?: string;
}

const seedPresentationById: Record<string, SeedPresentation> = {
  '00000000-0000-0000-0000-000000000201': {
    sakLabel: 'FP-001',
    scenario: 'Standard innvilgelse: begge foreldre, ett barn, 100 %',
    applicantName: 'Ingrid Hansen',
  },
  '00000000-0000-0000-0000-000000000202': {
    sakLabel: 'FP-002',
    scenario: 'Avslag - medlemskap',
  },
  '00000000-0000-0000-0000-000000000203': {
    sakLabel: 'FP-003',
    scenario: 'Engangsstønad',
  },
  '00000000-0000-0000-0000-000000000204': {
    sakLabel: 'FP-004',
    scenario: 'Manuell vurdering: stort avvik mellom snitt og årsinntekt',
    applicantName: 'Elin Johansen',
  },
  '00000000-0000-0000-0000-000000000205': {
    sakLabel: 'FP-005',
    scenario: 'Grensefall 25 prosent',
  },
};

export function getSakLabel(soknad: Pick<SoknadListeDto, 'id'>): string {
  return seedPresentationById[soknad.id]?.sakLabel ?? `FP-${soknad.id.slice(-6).toUpperCase()}`;
}

export function getScenarioLabel(soknad: Pick<SoknadListeDto, 'id'>): string {
  return seedPresentationById[soknad.id]?.scenario ?? 'Testsøknad';
}

export function getApplicantLabel(soknad: Pick<SoknadListeDto, 'id' | 'sokerIdent'>): string {
  return seedPresentationById[soknad.id]?.applicantName ?? soknad.sokerIdent;
}

export function harKomplisertOppfolging(soknad: SoknadListeDto): boolean {
  return Boolean(
    soknad.komplisert || soknad.harInternOppfolging || soknad.internOppfolging?.komplisert,
  );
}

export function getVedtaksvariantLabel(value: Vedtaksvariant): string {
  const labels: Record<Vedtaksvariant, string> = {
    INNVILGET: 'Innvilget',
    AVSLAG: 'Avslag',
    ENGANGSSTONAD: 'Engangsstønad',
    MANUELL_VURDERING: 'Manuell vurdering',
  };

  return labels[value];
}

export function getSakStatusLabel(status: SakStatus, vedtak?: VedtakDto | null): string {
  if (status === 'TIL_MANUELL_VURDERING') {
    return 'Manuell vurdering';
  }
  if (vedtak?.variant) {
    return getVedtaksvariantLabel(vedtak.variant);
  }

  const labels: Record<SakStatus, string> = {
    OPPRETTET: 'Opprettet',
    TIL_MANUELL_VURDERING: 'Manuell vurdering',
    FERDIGSTILT: 'Ferdigstilt',
  };

  return labels[status];
}

export function formatIsoDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }

  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function formatIsoDateTime(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    return value;
  }

  return `${match[3]}.${match[2]}.${match[1]} kl. ${match[4]}:${match[5]}`;
}

export function formatYearMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }

  return `${match[2]}.${match[1]}`;
}

export function formatKroner(value: number): string {
  return `${new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(value)} kr`;
}

export function formatDekningsgrad(value: string): string {
  const labels: Record<string, string> = {
    HUNDRE_PROSENT: '100 %',
    ATTI_PROSENT: '80 %',
  };

  return labels[value] ?? value.replaceAll('_', ' ').toLowerCase();
}

export function formatRegelnavn(value: string): string {
  const labels: Record<string, string> = {
    OPPTJENING: 'Opptjening',
    BEREGNINGSGRUNNLAG: 'Beregningsgrunnlag',
    ENGANGSSTONAD: 'Engangsstønad',
    STONADSPERIODE: 'Stønadsperiode',
    KVOTEFORDELING: 'Kvotefordeling',
  };

  return labels[value] ?? value.replaceAll('_', ' ').toLowerCase();
}

export function formatRegelStatus(value: RegelStatus): string {
  const labels: Record<RegelStatus, string> = {
    OPPFYLT: 'Oppfylt',
    IKKE_OPPFYLT: 'Ikke oppfylt',
    MANUELL_VURDERING: 'Manuell vurdering',
  };

  return labels[value];
}

export function formatInntektsType(value: string): string {
  const labels: Record<string, string> = {
    ARBEID: 'Arbeid',
    SYKEPENGER: 'Sykepenger',
    FORELDREPENGER: 'Foreldrepenger',
  };

  return labels[value] ?? value.replaceAll('_', ' ').toLowerCase();
}

export function formatRettsforhold(value: string): string {
  const labels: Record<string, string> = {
    BEGGE_FORELDRE: 'Begge foreldre',
    MOR_ALENE: 'Mor alene',
    FAR_ALENE: 'Far alene',
    MEDMOR_ALENE: 'Medmor alene',
  };

  return labels[value] ?? value.replaceAll('_', ' ').toLowerCase();
}
