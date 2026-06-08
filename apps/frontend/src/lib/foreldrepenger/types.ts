export type SakStatus = 'OPPRETTET' | 'TIL_MANUELL_VURDERING' | 'FERDIGSTILT';
export type Vedtaksvariant = 'INNVILGET' | 'AVSLAG' | 'ENGANGSSTONAD' | 'MANUELL_VURDERING';
export type RegelStatus = 'OPPFYLT' | 'IKKE_OPPFYLT' | 'MANUELL_VURDERING';
export type ManuellBeslutningType = 'INNVILGELSE' | 'AVSLAG';

export interface SoknadListeResponse {
  soknader: SoknadListeDto[];
}

export interface SoknadListeDto {
  id: string;
  sokerIdent: string;
  innsendt: string;
  termindato: string;
  rettsforhold: string;
  dekningsgrad: string;
  antallBarn: number;
  oppgittAarsinntektKroner: number;
  komplisert?: boolean;
  harInternOppfolging?: boolean;
  internOppfolging?: {
    komplisert?: boolean;
  };
}

export interface StartBehandlingRequest {
  soknadId: string;
}

export interface DemoResetResponse {
  antallSoknader: number;
}

export interface ManuellBeslutningRequest {
  type: ManuellBeslutningType;
  begrunnelse: string;
  besluttetAv: string;
}

export interface InternMerknad {
  sakId: number;
  komplisert: boolean;
  kommentar: string;
  oppdatertAv: string | null;
  oppdatertTidspunkt: string | null;
}

export interface InternMerknadRequest {
  komplisert: boolean;
  kommentar: string;
  oppdatertAv: string;
}

export interface InternMerknadOversikt {
  sakId: number;
  saksnummer: string;
  sokerIdent: string;
  status: SakStatus;
  vedtaksvariant: Vedtaksvariant;
  komplisert: boolean;
  kommentar: string;
  oppdatertAv: string;
  oppdatertTidspunkt: string;
}

export interface InterneMerknaderResponse {
  saker: InternMerknadOversikt[];
}

export interface BehandlingResultatResponse {
  sakId: number;
  soknadId: string;
  status: SakStatus;
  vedtaksvariant: Vedtaksvariant;
  regelspor?: RegelresultatDto[];
  vedtak?: VedtakDto | null;
  manuellVurdering?: ManuellVurderingDto | null;
}

export interface SakResponse {
  sakId: number;
  soknad: SaksdataDto;
  status: SakStatus;
  opprettetTidspunkt: string;
  ferdigstiltTidspunkt?: string | null;
  regelspor: RegelresultatDto[];
  vedtak?: VedtakDto | null;
  manuellVurdering?: ManuellVurderingDto | null;
}

export interface SaksdataDto {
  id: string;
  sokerIdent: string;
  erNorskBorger: boolean;
  innsendt: string;
  termindato: string;
  rettsforhold: string;
  dekningsgrad: string;
  antallBarn: number;
  oppgittAarsinntektKroner: number;
  inntekter: InntektDto[];
}

export interface InntektDto {
  maned: string;
  type: string;
  belopKroner: number;
}

export interface RegelresultatDto {
  regel: string;
  status: RegelStatus;
  begrunnelse: string;
}

export interface ManuellVurderingDto {
  grunn: string;
}

export interface VedtakDto {
  variant: Vedtaksvariant;
  begrunnelse: string;
  belopKroner?: number | null;
  stonadsperiode?: StonadsperiodeDto | null;
  kvoter?: KvoterDto | null;
  besluttetAv?: string | null;
  besluttetTidspunkt?: string | null;
}

export interface StonadsperiodeDto {
  fom: string;
  tom: string;
  uker: number;
}

export interface KvoterDto {
  modrekvoteUker: number;
  fedrekvoteUker: number;
  fellesperiodeUker: number;
  bonusuker: number;
  forskuddUker: number;
  totalUker: number;
}
