import { describe, it, expect } from 'vitest';
import {
  validateCityForm,
  validateUserForm,
  parseProblemDetail,
  getErrorMessageFromBody,
  getErrorMessageFromResponse,
} from './validation';

describe('validateCityForm', () => {
  it('should return no errors for valid input', () => {
    const errors = validateCityForm('Oslo', '700000');
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should return error when name is blank', () => {
    const errors = validateCityForm('', '100');
    expect(errors.name).toBe('Navn kan ikke være tomt');
  });

  it('should return error when name is only whitespace', () => {
    const errors = validateCityForm('   ', '100');
    expect(errors.name).toBe('Navn kan ikke være tomt');
  });

  it('should return error when name exceeds 255 characters', () => {
    const longName = 'A'.repeat(256);
    const errors = validateCityForm(longName, '100');
    expect(errors.name).toBe('Navn kan være maks 255 tegn');
  });

  it('should return error when name contains invalid characters', () => {
    const errors = validateCityForm('Oslo<script>', '100');
    expect(errors.name).toBe('Navn inneholder ugyldige tegn');
  });

  it('should accept name with accented characters', () => {
    const errors = validateCityForm('Zürich', '400000');
    expect(errors.name).toBeUndefined();
  });

  it('should accept name with hyphens and dots', () => {
    const errors = validateCityForm('St. Olavs-plass', '5000');
    expect(errors.name).toBeUndefined();
  });

  it('should return error when population is empty', () => {
    const errors = validateCityForm('Oslo', '');
    expect(errors.population).toBe('Innbyggertall må være et tall');
  });

  it('should return error when population is not a number', () => {
    const errors = validateCityForm('Oslo', 'abc');
    expect(errors.population).toBe('Innbyggertall må være et tall');
  });

  it('should return error when population is negative', () => {
    const errors = validateCityForm('Oslo', '-1');
    expect(errors.population).toBe('Innbyggertall kan ikke være negativt');
  });

  it('should return error when population is not an integer', () => {
    const errors = validateCityForm('Oslo', '1.5');
    expect(errors.population).toBe('Innbyggertall må være et heltall');
  });

  it('should return multiple errors when both fields are invalid', () => {
    const errors = validateCityForm('', '-5');
    expect(errors.name).toBeDefined();
    expect(errors.population).toBeDefined();
  });
});

describe('validateUserForm', () => {
  it('should return no errors for valid input', () => {
    const errors = validateUserForm('Ola Nordmann', '30');
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should return error when name is blank', () => {
    const errors = validateUserForm('', '25');
    expect(errors.name).toBe('Navn kan ikke være tomt');
  });

  it('should return error when name exceeds 50 characters', () => {
    const longName = 'A'.repeat(51);
    const errors = validateUserForm(longName, '25');
    expect(errors.name).toBe('Navn kan være maks 50 tegn');
  });

  it('should return error when name contains invalid characters', () => {
    const errors = validateUserForm('Kari@hack', '25');
    expect(errors.name).toBe('Navn inneholder ugyldige tegn');
  });

  it('should return error when age is empty', () => {
    const errors = validateUserForm('Kari', '');
    expect(errors.age).toBe('Alder må være et tall');
  });

  it('should return error when age is negative', () => {
    const errors = validateUserForm('Kari', '-1');
    expect(errors.age).toBe('Alder må være mellom 0 og 150');
  });

  it('should return error when age exceeds 150', () => {
    const errors = validateUserForm('Kari', '200');
    expect(errors.age).toBe('Alder må være mellom 0 og 150');
  });

  it('should return error when age is not an integer', () => {
    const errors = validateUserForm('Kari', '25.5');
    expect(errors.age).toBe('Alder må være et heltall');
  });

  it('should accept age at boundaries (0 and 150)', () => {
    expect(Object.keys(validateUserForm('Kari', '0'))).toHaveLength(0);
    expect(Object.keys(validateUserForm('Kari', '150'))).toHaveLength(0);
  });
});

describe('parseProblemDetail', () => {
  it('should parse valid ProblemDetail object', () => {
    const data = {
      title: 'Validation Failed',
      status: 422,
      detail: 'name must not be blank',
      errors: ['name must not be blank'],
    };
    const result = parseProblemDetail(data);
    expect(result).toEqual(data);
  });

  it('should return null for invalid data', () => {
    expect(parseProblemDetail(null)).toBeNull();
    expect(parseProblemDetail('string')).toBeNull();
    expect(parseProblemDetail({ title: 'only title' })).toBeNull();
  });
});

describe('getErrorMessageFromBody', () => {
  it('should prefer errors from RFC7807 bodies', () => {
    expect(
      getErrorMessageFromBody({
        title: 'Validation Failed',
        status: 400,
        detail: 'Invalid request',
        errors: ['name must not be blank', 'age must be positive'],
      }),
    ).toBe('name must not be blank; age must be positive');
  });

  it('should fall back to detail and error fields', () => {
    expect(
      getErrorMessageFromBody({
        title: 'Bad Request',
        status: 400,
        detail: 'name must not be blank',
      }),
    ).toBe('name must not be blank');

    expect(getErrorMessageFromBody({ error: 'Backend unavailable' })).toBe('Backend unavailable');
  });

  it('should return null when no user-facing message exists', () => {
    expect(getErrorMessageFromBody({ status: 500 })).toBeNull();
    expect(getErrorMessageFromBody('plain text')).toBeNull();
  });
});

describe('getErrorMessageFromResponse', () => {
  it('should parse JSON error responses', async () => {
    const response = new Response(JSON.stringify({ detail: 'Server validation failed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/problem+json' },
    });

    await expect(getErrorMessageFromResponse(response)).resolves.toBe('Server validation failed');
  });

  it('should return plain text error responses', async () => {
    const response = new Response('Gateway timeout', { status: 504 });

    await expect(getErrorMessageFromResponse(response)).resolves.toBe('Gateway timeout');
  });
});
