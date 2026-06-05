export const SOKNADER_API_PATH = '/api/v1/foreldrepenger/soknader';
export const SAKER_API_PATH = '/api/v1/foreldrepenger/saker';
export const VEDTAK_API_PATH = '/api/v1/foreldrepenger/vedtak';
export const DEMO_RESET_API_PATH = '/api/v1/foreldrepenger/demo/reset';

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

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readErrorMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (!isRecord(body)) {
    return undefined;
  }
  for (const key of ['detail', 'error', 'title']) {
    const value = body[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return text;
    }
    throw error;
  }
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
    });
  } catch (error) {
    throw new ApiClientError(
      `Klarte ikke å kontakte frontend-API-et: ${
        error instanceof Error ? error.message : 'Ukjent feil'
      }`,
    );
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new ApiClientError(
      readErrorMessage(body) ?? `Frontend-API-et svarte med status ${response.status}`,
      response.status,
    );
  }

  return body as T;
}

export async function hentSoknader(): Promise<SoknadListeDto[]> {
  const response = await fetchJson<SoknadListeResponse>(SOKNADER_API_PATH);
  if (!Array.isArray(response.soknader)) {
    throw new ApiClientError('Frontend-API-et returnerte en uventet søknadsliste', 502);
  }
  return response.soknader;
}

export function sakApiPath(sakId: string | number): string {
  return `${SAKER_API_PATH}/${encodeURIComponent(String(sakId).trim())}`;
}

export function manuellBeslutningApiPath(sakId: string | number): string {
  return `${sakApiPath(sakId)}/beslutning`;
}

export async function hentSak(sakId: string | number): Promise<SakResponse> {
  const response = await fetchJson<SakResponse>(sakApiPath(sakId));
  if (
    typeof response.sakId !== 'number' ||
    typeof response.soknad?.id !== 'string' ||
    !Array.isArray(response.regelspor)
  ) {
    throw new ApiClientError('Frontend-API-et returnerte en uventet sakrespons', 502);
  }

  return response;
}

export async function besluttManuelt(
  sakId: string | number,
  request: ManuellBeslutningRequest,
): Promise<SakResponse> {
  const response = await fetchJson<SakResponse>(manuellBeslutningApiPath(sakId), {
    method: 'POST',
    body: JSON.stringify({
      type: request.type,
      begrunnelse: request.begrunnelse.trim(),
      besluttetAv: request.besluttetAv.trim(),
    } satisfies ManuellBeslutningRequest),
  });

  if (
    typeof response.sakId !== 'number' ||
    typeof response.soknad?.id !== 'string' ||
    !Array.isArray(response.regelspor)
  ) {
    throw new ApiClientError('Frontend-API-et returnerte en uventet sakrespons', 502);
  }

  return response;
}

export async function startBehandling(soknadId: string): Promise<BehandlingResultatResponse> {
  const response = await fetchJson<BehandlingResultatResponse>(VEDTAK_API_PATH, {
    method: 'POST',
    body: JSON.stringify({ soknadId } satisfies StartBehandlingRequest),
  });

  if (typeof response.sakId !== 'number') {
    throw new ApiClientError('Frontend-API-et returnerte en uventet sakrespons', 502);
  }

  return response;
}

export async function tilbakestillDemodata(): Promise<DemoResetResponse> {
  const response = await fetchJson<DemoResetResponse>(DEMO_RESET_API_PATH, {
    method: 'POST',
  });

  if (typeof response.antallSoknader !== 'number') {
    throw new ApiClientError('Frontend-API-et returnerte et uventet svar på nullstilling', 502);
  }

  return response;
}

export function getSakLabel(soknad: Pick<SoknadListeDto, 'id'>): string {
  return seedPresentationById[soknad.id]?.sakLabel ?? `FP-${soknad.id.slice(-6).toUpperCase()}`;
}

export function getScenarioLabel(soknad: Pick<SoknadListeDto, 'id'>): string {
  return seedPresentationById[soknad.id]?.scenario ?? 'Testsøknad';
}

export function getApplicantLabel(soknad: Pick<SoknadListeDto, 'id' | 'sokerIdent'>): string {
  return seedPresentationById[soknad.id]?.applicantName ?? soknad.sokerIdent;
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

export function harKomplisertOppfolging(soknad: SoknadListeDto): boolean {
  return Boolean(
    soknad.komplisert || soknad.harInternOppfolging || soknad.internOppfolging?.komplisert,
  );
}
