const NAME_PATTERN = /^[a-zA-ZÀ-Ÿ0-9 \-_.]+$/;

export interface ValidationErrors {
  [field: string]: string | undefined;
}

export function validateCityForm(name: string, population: string): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!name.trim()) {
    errors.name = 'Navn kan ikke være tomt';
  } else if (name.length > 255) {
    errors.name = 'Navn kan være maks 255 tegn';
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = 'Navn inneholder ugyldige tegn';
  }

  const pop = Number(population);
  if (population.trim() === '' || isNaN(pop)) {
    errors.population = 'Innbyggertall må være et tall';
  } else if (pop < 0) {
    errors.population = 'Innbyggertall kan ikke være negativt';
  } else if (!Number.isInteger(pop)) {
    errors.population = 'Innbyggertall må være et heltall';
  }

  return errors;
}

export function validateUserForm(name: string, age: string): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!name.trim()) {
    errors.name = 'Navn kan ikke være tomt';
  } else if (name.length > 50) {
    errors.name = 'Navn kan være maks 50 tegn';
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = 'Navn inneholder ugyldige tegn';
  }

  const ageNum = Number(age);
  if (age.trim() === '' || isNaN(ageNum)) {
    errors.age = 'Alder må være et tall';
  } else if (ageNum < 0 || ageNum > 150) {
    errors.age = 'Alder må være mellom 0 og 150';
  } else if (!Number.isInteger(ageNum)) {
    errors.age = 'Alder må være et heltall';
  }

  return errors;
}

export interface ProblemDetail {
  title: string;
  status: number;
  detail: string;
  errors?: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseProblemDetail(data: unknown): ProblemDetail | null {
  if (
    isRecord(data) &&
    typeof data.title === 'string' &&
    typeof data.status === 'number' &&
    typeof data.detail === 'string' &&
    (data.errors === undefined || isStringArray(data.errors))
  ) {
    return {
      title: data.title,
      status: data.status,
      detail: data.detail,
      errors: data.errors,
    };
  }
  return null;
}

export function getErrorMessageFromBody(data: unknown): string | null {
  const problem = parseProblemDetail(data);
  if (problem) {
    if (problem.errors && problem.errors.length > 0) {
      return problem.errors.join('; ');
    }
    return problem.detail || problem.title;
  }

  if (!isRecord(data)) {
    return null;
  }

  if (isStringArray(data.errors) && data.errors.length > 0) {
    return data.errors.join('; ');
  }
  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }
  if (typeof data.title === 'string' && data.title.trim()) {
    return data.title;
  }

  return null;
}

export async function getErrorMessageFromResponse(response: Response): Promise<string | null> {
  const body = await response.text();
  if (!body.trim()) {
    return null;
  }

  try {
    return getErrorMessageFromBody(JSON.parse(body) as unknown) ?? body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return body;
    }
    throw error;
  }
}
