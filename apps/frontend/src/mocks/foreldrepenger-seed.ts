import type { SoknadListeDto, SoknadListeResponse } from '../lib/foreldrepenger';

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
    sokerIdent: 'TEST-0004',
    innsendt: '2026-06-15',
    termindato: '2026-08-01',
    rettsforhold: 'BEGGE_FORELDRE',
    dekningsgrad: 'HUNDRE_PROSENT',
    antallBarn: 1,
    oppgittAarsinntektKroner: 400_000,
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
