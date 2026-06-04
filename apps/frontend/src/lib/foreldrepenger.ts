export const SOKNADER_API_PATH = '/api/v1/foreldrepenger/soknader';
export const VEDTAK_API_PATH = '/api/v1/foreldrepenger/vedtak';

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

export interface BehandlingResultatResponse {
  sakId: number;
  soknadId: string;
  status: 'OPPRETTET' | 'TIL_MANUELL_VURDERING' | 'FERDIGSTILT';
  vedtaksvariant: 'INNVILGET' | 'AVSLAG' | 'ENGANGSSTONAD' | 'MANUELL_VURDERING';
}

interface SeedPresentation {
  sakLabel: string;
  scenario: string;
}

const seedPresentationById: Record<string, SeedPresentation> = {
  '00000000-0000-0000-0000-000000000201': {
    sakLabel: 'FP-001',
    scenario: 'Standard innvilgelse',
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
    scenario: 'Manuell vurdering',
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

export function getSakLabel(soknad: Pick<SoknadListeDto, 'id'>): string {
  return seedPresentationById[soknad.id]?.sakLabel ?? `FP-${soknad.id.slice(-6).toUpperCase()}`;
}

export function getScenarioLabel(soknad: Pick<SoknadListeDto, 'id'>): string {
  return seedPresentationById[soknad.id]?.scenario ?? 'Testsøknad';
}

export function formatIsoDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }

  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function formatDekningsgrad(value: string): string {
  const labels: Record<string, string> = {
    HUNDRE_PROSENT: '100 %',
    ATTI_PROSENT: '80 %',
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
