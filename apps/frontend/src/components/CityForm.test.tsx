import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CityForm } from './CityForm';

describe('CityForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders form fields and submit button', () => {
    render(<CityForm />);

    expect(screen.getByLabelText('Navn')).toBeInTheDocument();
    expect(screen.getByLabelText('Innbyggertall')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opprett by' })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<CityForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Opprett by' }));

    expect(await screen.findByText('Navn kan ikke være tomt')).toBeInTheDocument();
    expect(await screen.findByText('Innbyggertall må være et tall')).toBeInTheDocument();
  });

  it('shows error for invalid characters in name', async () => {
    render(<CityForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Oslo<>' } });
    fireEvent.change(screen.getByLabelText('Innbyggertall'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett by' }));

    expect(await screen.findByText('Navn inneholder ugyldige tegn')).toBeInTheDocument();
  });

  it('shows error for negative population', async () => {
    render(<CityForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Oslo' } });
    fireEvent.change(screen.getByLabelText('Innbyggertall'), { target: { value: '-5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett by' }));

    expect(await screen.findByText('Innbyggertall kan ikke være negativt')).toBeInTheDocument();
  });

  it('submits valid form and shows success message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(1), { status: 201 }),
    );

    render(<CityForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Bergen' } });
    fireEvent.change(screen.getByLabelText('Innbyggertall'), { target: { value: '280000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett by' }));

    expect(await screen.findByText('By "Bergen" ble opprettet.')).toBeInTheDocument();
    expect(screen.getByLabelText('Navn')).toHaveDisplayValue('');
    expect(screen.getByLabelText('Innbyggertall')).toHaveDisplayValue('');
    expect(fetch).toHaveBeenCalledWith(
      '/api/cities',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Bergen', population: 280000 }),
      }),
    );
  });

  it('trims city name before submit and success message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(1), { status: 201 }),
    );

    render(<CityForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: '  Bergen  ' } });
    fireEvent.change(screen.getByLabelText('Innbyggertall'), { target: { value: '280000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett by' }));

    expect(await screen.findByText('By "Bergen" ble opprettet.')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/cities',
      expect.objectContaining({
        body: JSON.stringify({ name: 'Bergen', population: 280000 }),
      }),
    );
  });

  it('validates trimmed city name before length checks', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(1), { status: 201 }),
    );

    render(<CityForm />);

    const maxLengthName = 'A'.repeat(255);
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: ` ${maxLengthName} ` } });
    fireEvent.change(screen.getByLabelText('Innbyggertall'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett by' }));

    expect(await screen.findByText(`By "${maxLengthName}" ble opprettet.`)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/cities',
      expect.objectContaining({
        body: JSON.stringify({ name: maxLengthName, population: 100 }),
      }),
    );
  });

  it('shows server validation errors on 422 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          title: 'Validation Failed',
          status: 422,
          detail: 'name contains invalid characters',
          errors: ['name contains invalid characters'],
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    render(<CityForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Valid' } });
    fireEvent.change(screen.getByLabelText('Innbyggertall'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett by' }));

    expect(await screen.findByText('name contains invalid characters')).toBeInTheDocument();
  });

  it('shows server detail on 400 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          title: 'Bad Request',
          status: 400,
          detail: 'population must be greater than zero',
        }),
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );

    render(<CityForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Valid' } });
    fireEvent.change(screen.getByLabelText('Innbyggertall'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett by' }));

    expect(await screen.findByText('population must be greater than zero')).toBeInTheDocument();
  });
});
