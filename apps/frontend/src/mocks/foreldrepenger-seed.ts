import type {
  InternMerknad,
  InternMerknadOversikt,
  ManuellBeslutningType,
  SakResponse,
  SoknadListeDto,
  SoknadListeResponse,
} from '../lib/foreldrepenger';

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
      bonusuker: 0,
      forskuddUker: 3,
      totalUker: 49,
    },
  },
  manuellVurdering: null,
};

export const seedAvslagSakResponse: SakResponse = {
  sakId: 1002,
  soknad: {
    ...seedSoknader[1],
    erNorskBorger: false,
    inntekter: [
      { maned: '2026-03', type: 'ARBEID', belopKroner: 42_000 },
      { maned: '2026-04', type: 'ARBEID', belopKroner: 43_000 },
    ],
  },
  status: 'FERDIGSTILT',
  opprettetTidspunkt: '2026-06-15T10:02:00Z',
  ferdigstiltTidspunkt: '2026-06-15T10:02:30Z',
  regelspor: [
    {
      regel: 'OPPTJENING',
      status: 'IKKE_OPPFYLT',
      begrunnelse: 'Opptjeningskravet er ikke oppfylt med 2 registrerte inntektsmåneder',
    },
    {
      regel: 'ENGANGSSTONAD',
      status: 'IKKE_OPPFYLT',
      begrunnelse: 'Opptjeningskravet er ikke oppfylt og søker er ikke norsk borger',
    },
  ],
  vedtak: {
    variant: 'AVSLAG',
    begrunnelse: 'Opptjeningskravet er ikke oppfylt og søker er ikke norsk borger',
  },
  manuellVurdering: null,
};

export const seedEngangsstonadSakResponse: SakResponse = {
  sakId: 1003,
  soknad: {
    ...seedSoknader[2],
    erNorskBorger: true,
    inntekter: [
      { maned: '2026-03', type: 'ARBEID', belopKroner: 38_000 },
      { maned: '2026-04', type: 'ARBEID', belopKroner: 39_000 },
    ],
  },
  status: 'FERDIGSTILT',
  opprettetTidspunkt: '2026-06-15T10:03:00Z',
  ferdigstiltTidspunkt: '2026-06-15T10:03:30Z',
  regelspor: [
    {
      regel: 'OPPTJENING',
      status: 'IKKE_OPPFYLT',
      begrunnelse: 'Opptjeningskravet er ikke oppfylt med 2 registrerte inntektsmåneder',
    },
    {
      regel: 'ENGANGSSTONAD',
      status: 'OPPFYLT',
      begrunnelse: 'Søker får engangsstønad på 92648 kr',
    },
  ],
  vedtak: {
    variant: 'ENGANGSSTONAD',
    begrunnelse: 'Opptjeningskravet er ikke oppfylt, men søker er norsk borger',
    belopKroner: 92_648,
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

export function createManualDecisionSakResponse(
  type: ManuellBeslutningType,
  begrunnelse: string,
  besluttetAv: string,
): SakResponse {
  const besluttetTidspunkt = '2026-06-15T10:05:00Z';
  const vedtak =
    type === 'INNVILGELSE'
      ? {
          variant: 'INNVILGET' as const,
          begrunnelse,
          belopKroner: seedManuellVurderingSakResponse.soknad.oppgittAarsinntektKroner,
          stonadsperiode: {
            fom: '2026-08-10',
            tom: '2027-07-18',
            uker: 49,
          },
          kvoter: {
            modrekvoteUker: 15,
            fedrekvoteUker: 15,
            fellesperiodeUker: 16,
            bonusuker: 0,
            forskuddUker: 3,
            totalUker: 49,
          },
          besluttetAv,
          besluttetTidspunkt,
        }
      : {
          variant: 'AVSLAG' as const,
          begrunnelse,
          besluttetAv,
          besluttetTidspunkt,
        };

  return {
    ...seedManuellVurderingSakResponse,
    status: 'FERDIGSTILT',
    ferdigstiltTidspunkt: besluttetTidspunkt,
    vedtak,
    manuellVurdering: null,
  };
}

export const seedSakResponsesById: Record<string, SakResponse> = {
  '1001': seedInnvilgetSakResponse,
  '1002': seedAvslagSakResponse,
  '1003': seedEngangsstonadSakResponse,
  '1004': seedManuellVurderingSakResponse,
};

const seedSakIdBySoknadId: Record<string, number> = {
  [seedSoknader[0].id]: 1001,
  [seedSoknader[1].id]: 1002,
  [seedSoknader[2].id]: 1003,
  [seedSoknader[3].id]: 1004,
};

export function getSeedSakResponseById(sakId: string): SakResponse | undefined {
  return seedSakResponsesById[sakId];
}

export function getSeedSakIdForSoknad(soknadId: string): number {
  return seedSakIdBySoknadId[soknadId] ?? 1001;
}

export function emptyInternMerknad(sakId: number): InternMerknad {
  return {
    sakId,
    komplisert: false,
    kommentar: '',
    oppdatertAv: null,
    oppdatertTidspunkt: null,
  };
}

export const seedInterneMerknader: Record<string, InternMerknad> = {
  '1001': {
    sakId: 1001,
    komplisert: true,
    kommentar:
      'Avklarte kvotefordeling og beregningsgrunnlag med fagstøtte før endelig vedtak. Egnet for læring i teammøte.',
    oppdatertAv: 'Kari Saksbehandler',
    oppdatertTidspunkt: '2026-06-05T09:12:00Z',
  },
};

export const seedInternMerknadOversikt: InternMerknadOversikt[] = [
  {
    sakId: 1001,
    saksnummer: 'FP-001',
    sokerIdent: 'TEST-0001',
    status: 'FERDIGSTILT',
    vedtaksvariant: 'INNVILGET',
    komplisert: true,
    kommentar:
      'Avklarte kvotefordeling og beregningsgrunnlag med fagstøtte før endelig vedtak. Egnet for læring i teammøte.',
    oppdatertAv: 'Kari Saksbehandler',
    oppdatertTidspunkt: '2026-06-05T09:12:00Z',
  },
];
