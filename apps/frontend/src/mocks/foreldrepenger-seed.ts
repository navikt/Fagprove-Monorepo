import type { SakResponse, SoknadListeDto, SoknadListeResponse } from '../lib/foreldrepenger';

export const seedSoknader: SoknadListeDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    sokerIdent: 'TEST-0001',
    innsendt: '2026-06-15',
    termindato: '2026-08-01',
    rettsforhold: 'BEGGE_FORELDRE',
    dekningsgrad: 'HUNDRE_PROSENT',
    antallBarn: 1,
    oppgittAarsinntektKroner: 648_000,
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    sokerIdent: 'TEST-0002',
    innsendt: '2026-06-15',
    termindato: '2026-08-01',
    rettsforhold: 'BEGGE_FORELDRE',
    dekningsgrad: 'HUNDRE_PROSENT',
    antallBarn: 1,
    oppgittAarsinntektKroner: 600_000,
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    sokerIdent: 'TEST-0003',
    innsendt: '2026-06-15',
    termindato: '2026-08-01',
    rettsforhold: 'BEGGE_FORELDRE',
    dekningsgrad: 'HUNDRE_PROSENT',
    antallBarn: 1,
    oppgittAarsinntektKroner: 540_000,
  },
  {
    id: '00000000-0000-0000-0000-000000000204',
    sokerIdent: 'TEST-4567',
    innsendt: '2026-06-04',
    termindato: '2026-08-10',
    rettsforhold: 'BEGGE_FORELDRE',
    dekningsgrad: 'HUNDRE_PROSENT',
    antallBarn: 1,
    oppgittAarsinntektKroner: 600_000,
  },
  {
    id: '00000000-0000-0000-0000-000000000205',
    sokerIdent: 'TEST-0005',
    innsendt: '2026-06-15',
    termindato: '2026-08-01',
    rettsforhold: 'BEGGE_FORELDRE',
    dekningsgrad: 'HUNDRE_PROSENT',
    antallBarn: 1,
    oppgittAarsinntektKroner: 480_000,
  },
];

export const seedSoknaderResponse: SoknadListeResponse = {
  soknader: seedSoknader,
};

const standardInntekter = [
  { maned: '2026-01', type: 'ARBEID', belopKroner: 50_000 },
  { maned: '2026-02', type: 'ARBEID', belopKroner: 50_000 },
  { maned: '2026-03', type: 'ARBEID', belopKroner: 50_000 },
  { maned: '2026-04', type: 'ARBEID', belopKroner: 50_000 },
  { maned: '2026-05', type: 'ARBEID', belopKroner: 50_000 },
  { maned: '2026-06', type: 'ARBEID', belopKroner: 20_000 },
  { maned: '2026-07', type: 'ARBEID', belopKroner: 25_000 },
  { maned: '2026-08', type: 'ARBEID', belopKroner: 22_000 },
];

export const seedInnvilgetSakResponse: SakResponse = {
  sakId: 1001,
  soknad: {
    ...seedSoknader[0],
    erNorskBorger: true,
    inntekter: [
      { maned: '2025-12', type: 'ARBEID', belopKroner: 48_000 },
      { maned: '2026-01', type: 'ARBEID', belopKroner: 47_000 },
      { maned: '2026-02', type: 'SYKEPENGER', belopKroner: 49_000 },
      { maned: '2026-03', type: 'ARBEID', belopKroner: 52_000 },
      { maned: '2026-04', type: 'ARBEID', belopKroner: 54_000 },
      { maned: '2026-05', type: 'FORELDREPENGER', belopKroner: 56_000 },
    ],
  },
  status: 'FERDIGSTILT',
  opprettetTidspunkt: '2026-06-15T10:00:00Z',
  ferdigstiltTidspunkt: '2026-06-15T10:01:00Z',
  regelspor: [
    {
      regel: 'OPPTJENING',
      status: 'OPPFYLT',
      begrunnelse: 'Opptjeningskravet er oppfylt med 6 registrerte inntektsmåneder',
    },
    {
      regel: 'BEREGNINGSGRUNNLAG',
      status: 'OPPFYLT',
      begrunnelse: 'Beregningsgrunnlag er 648000 kr',
    },
    {
      regel: 'STONADSPERIODE',
      status: 'OPPFYLT',
      begrunnelse: 'Stønadsperioden er 49 uker ved 100 % dekning',
    },
    {
      regel: 'KVOTEFORDELING',
      status: 'OPPFYLT',
      begrunnelse: 'Kvotene summerer til 49 uker',
    },
  ],
  vedtak: {
    variant: 'INNVILGET',
    begrunnelse: 'Søknaden er innvilget',
    belopKroner: 648_000,
    stonadsperiode: {
      fom: '2026-08-01',
      tom: '2027-07-09',
      uker: 49,
    },
    kvoter: {
      modrekvoteUker: 15,
      fedrekvoteUker: 15,
      fellesperiodeUker: 16,
      bonusuker: 3,
      forskuddUker: 0,
      totalUker: 49,
    },
  },
  manuellVurdering: null,
};

export const seedManuellVurderingSakResponse: SakResponse = {
  sakId: 1004,
  soknad: {
    ...seedSoknader[3],
    erNorskBorger: true,
    inntekter: standardInntekter,
  },
  status: 'TIL_MANUELL_VURDERING',
  opprettetTidspunkt: '2026-06-15T10:04:00Z',
  ferdigstiltTidspunkt: null,
  regelspor: [
    {
      regel: 'OPPTJENING',
      status: 'OPPFYLT',
      begrunnelse: 'Opptjeningskravet er oppfylt med 6 registrerte inntektsmåneder',
    },
    {
      regel: 'BEREGNINGSGRUNNLAG',
      status: 'MANUELL_VURDERING',
      begrunnelse: 'Ikke fastsatt maskinelt',
    },
  ],
  vedtak: null,
  manuellVurdering: {
    grunn:
      'For stort sprik mellom tre måneders snitt og oppgitt årsinntekt. Saksbehandler må vurdere grunnlaget.',
  },
};

export const seedSakResponsesById: Record<string, SakResponse> = {
  '1001': seedInnvilgetSakResponse,
  '1004': seedManuellVurderingSakResponse,
};

const seedSakIdBySoknadId: Record<string, number> = {
  [seedSoknader[0].id]: 1001,
  [seedSoknader[3].id]: 1004,
};

export function getSeedSakResponseById(sakId: string): SakResponse | undefined {
  return seedSakResponsesById[sakId];
}

export function getSeedSakIdForSoknad(soknadId: string): number {
  return seedSakIdBySoknadId[soknadId] ?? 1001;
}
