import { useState } from 'react';
import { TextField, Button, Heading, InlineMessage, VStack, Box } from '@navikt/ds-react';
import { validateCityForm, getErrorMessageFromResponse, type ValidationErrors } from './validation';

export function CityForm() {
  const [name, setName] = useState('');
  const [population, setPopulation] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const validationErrors = validateCityForm(trimmedName, population);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, population: Number(population) }),
      });

      if (!response.ok) {
        const message = await getErrorMessageFromResponse(response);
        setServerError(message ?? 'Noe gikk galt. Prøv igjen senere.');
      } else {
        setSuccess(`By "${trimmedName}" ble opprettet.`);
        setName('');
        setPopulation('');
        setErrors({});
      }
    } catch {
      setServerError('Kunne ikke nå serveren. Sjekk at backend kjører.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <VStack gap="space-16">
        <Heading level="2" size="medium">
          Opprett by
        </Heading>

        <TextField
          label="Navn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="off"
        />

        <TextField
          label="Innbyggertall"
          type="number"
          value={population}
          onChange={(e) => setPopulation(e.target.value)}
          error={errors.population}
          autoComplete="off"
        />

        {serverError && (
          <InlineMessage status="error" role="alert">
            {serverError}
          </InlineMessage>
        )}

        {success && (
          <InlineMessage status="success" role="status">
            {success}
          </InlineMessage>
        )}

        <Box>
          <Button type="submit" variant="primary" loading={submitting}>
            Opprett by
          </Button>
        </Box>
      </VStack>
    </form>
  );
}
