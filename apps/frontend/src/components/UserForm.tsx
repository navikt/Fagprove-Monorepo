import { useState } from 'react';
import { TextField, Button, Heading, InlineMessage, VStack, Box } from '@navikt/ds-react';
import { validateUserForm, getErrorMessageFromResponse, type ValidationErrors } from './validation';

export function UserForm() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const validationErrors = validateUserForm(trimmedName, age);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, age: Number(age) }),
      });

      if (!response.ok) {
        const message = await getErrorMessageFromResponse(response);
        setServerError(message ?? 'Noe gikk galt. Prøv igjen senere.');
      } else {
        setSuccess(`Bruker "${trimmedName}" ble opprettet.`);
        setName('');
        setAge('');
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
          Opprett bruker
        </Heading>

        <TextField
          label="Navn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="off"
        />

        <TextField
          label="Alder"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          error={errors.age}
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
            Opprett bruker
          </Button>
        </Box>
      </VStack>
    </form>
  );
}
