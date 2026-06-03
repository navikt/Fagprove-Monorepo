import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserForm } from './UserForm';

describe('UserForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders form fields and submit button', () => {
    render(<UserForm />);

    expect(screen.getByLabelText('Navn')).toBeInTheDocument();
    expect(screen.getByLabelText('Alder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opprett bruker' })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<UserForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Opprett bruker' }));

    expect(await screen.findByText('Navn kan ikke være tomt')).toBeInTheDocument();
    expect(await screen.findByText('Alder må være et tall')).toBeInTheDocument();
  });

  it('shows error for name exceeding 50 characters', async () => {
    render(<UserForm />);

    const longName = 'A'.repeat(51);
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: longName } });
    fireEvent.change(screen.getByLabelText('Alder'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett bruker' }));

    expect(await screen.findByText('Navn kan være maks 50 tegn')).toBeInTheDocument();
  });

  it('shows error for age exceeding 150', async () => {
    render(<UserForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Kari' } });
    fireEvent.change(screen.getByLabelText('Alder'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett bruker' }));

    expect(await screen.findByText('Alder må være mellom 0 og 150')).toBeInTheDocument();
  });

  it('submits valid form and shows success message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(1), { status: 201 }),
    );

    render(<UserForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Ola Nordmann' } });
    fireEvent.change(screen.getByLabelText('Alder'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett bruker' }));

    expect(await screen.findByText('Bruker "Ola Nordmann" ble opprettet.')).toBeInTheDocument();
    expect(screen.getByLabelText('Navn')).toHaveDisplayValue('');
    expect(screen.getByLabelText('Alder')).toHaveDisplayValue('');
    expect(fetch).toHaveBeenCalledWith(
      '/api/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ola Nordmann', age: 30 }),
      }),
    );
  });

  it('trims user name before submit and success message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(1), { status: 201 }),
    );

    render(<UserForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: '  Ola Nordmann  ' } });
    fireEvent.change(screen.getByLabelText('Alder'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett bruker' }));

    expect(await screen.findByText('Bruker "Ola Nordmann" ble opprettet.')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/users',
      expect.objectContaining({
        body: JSON.stringify({ name: 'Ola Nordmann', age: 30 }),
      }),
    );
  });

  it('validates trimmed user name before length checks', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(1), { status: 201 }),
    );

    render(<UserForm />);

    const maxLengthName = 'A'.repeat(50);
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: ` ${maxLengthName} ` } });
    fireEvent.change(screen.getByLabelText('Alder'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett bruker' }));

    expect(await screen.findByText(`Bruker "${maxLengthName}" ble opprettet.`)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/users',
      expect.objectContaining({
        body: JSON.stringify({ name: maxLengthName, age: 30 }),
      }),
    );
  });

  it('shows server validation errors on 422 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          title: 'Validation Failed',
          status: 422,
          detail: 'age must be between 0 and 150',
          errors: ['age must be between 0 and 150'],
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    render(<UserForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Kari' } });
    fireEvent.change(screen.getByLabelText('Alder'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett bruker' }));

    expect(await screen.findByText('age must be between 0 and 150')).toBeInTheDocument();
  });

  it('shows server detail on 400 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          title: 'Bad Request',
          status: 400,
          detail: 'name must not be blank',
        }),
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );

    render(<UserForm />);

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Kari' } });
    fireEvent.change(screen.getByLabelText('Alder'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Opprett bruker' }));

    expect(await screen.findByText('name must not be blank')).toBeInTheDocument();
  });
});
