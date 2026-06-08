import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  BodyLong,
  BodyShort,
  Box,
  Button,
  Checkbox,
  Heading,
  HStack,
  Loader,
  LocalAlert,
  Tag,
  Textarea,
  VStack,
} from '@navikt/ds-react';
import {
  ApiClientError,
  DEMO_OPPDATERT_AV,
  formatIsoDate,
  formatIsoDateTime,
  lagreInternMerknad,
  type InternMerknad,
} from '../../../lib/foreldrepenger';

const MAKS_INTERN_KOMMENTAR_TEGN = 1_000;

interface InternOppfolgingPanelProps {
  sakId: number;
  merknad?: InternMerknad;
  loading: boolean;
  loadError?: string;
  onMerknadSaved: (merknad: InternMerknad) => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function formatOppdatert(tidspunkt: string | null): string {
  if (!tidspunkt) {
    return 'ukjent tidspunkt';
  }
  if (tidspunkt.includes('T')) {
    return formatIsoDateTime(tidspunkt);
  }
  return formatIsoDate(tidspunkt);
}

function harLagretMerknad(merknad?: InternMerknad): boolean {
  return Boolean(merknad && merknad.kommentar.trim());
}

export function InternOppfolgingPanel({
  sakId,
  merknad,
  loading,
  loadError,
  onMerknadSaved,
}: InternOppfolgingPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [komplisert, setKomplisert] = useState(false);
  const [kommentar, setKommentar] = useState('');
  const [kommentarError, setKommentarError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const saveErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!merknad) {
      return;
    }
    const editing = !harLagretMerknad(merknad);
    setKomplisert(merknad.komplisert);
    setKommentar(editing ? merknad.kommentar : '');
    setKommentarError(undefined);
    setSaveError(undefined);
    setIsEditing(editing);
  }, [merknad]);

  useEffect(() => {
    if (saveError) {
      saveErrorRef.current?.focus();
    }
  }, [saveError]);

  function startEditing() {
    if (merknad) {
      setKomplisert(merknad.komplisert);
      setKommentar(merknad.kommentar);
    }
    setKommentarError(undefined);
    setSaveError(undefined);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (merknad) {
      setKomplisert(merknad.komplisert);
    }
    setKommentar('');
    setKommentarError(undefined);
    setSaveError(undefined);
    setIsEditing(false);
  }

  async function handleSave() {
    const trimmedKommentar = kommentar.trim();
    if (komplisert && !trimmedKommentar) {
      setSaveError(undefined);
      setKommentarError('Kommentar må fylles ut når saken markeres som komplisert.');
      return;
    }

    setKommentarError(undefined);
    setSaveError(undefined);
    setSaving(true);

    try {
      const lagret = await lagreInternMerknad(sakId, {
        komplisert,
        kommentar,
        oppdatertAv: DEMO_OPPDATERT_AV,
      });
      onMerknadSaved(lagret);
    } catch (error) {
      setSaveError(getErrorMessage(error, 'Kunne ikke lagre intern merknad. Prøv igjen.'));
    } finally {
      setSaving(false);
    }
  }

  const visKomplisertTag = merknad?.komplisert ?? false;
  const lagretMerknad = harLagretMerknad(merknad);

  return (
    <Box as="section" padding="space-24" borderWidth="1" borderRadius="0">
      <VStack gap="space-16">
        <VStack gap="space-4">
          <HStack gap="space-12" align="center" wrap>
            <Heading level="2" size="large">
              Intern oppfølging
            </Heading>
            {visKomplisertTag && (
              <Tag size="medium" variant="warning">
                Komplisert sak
              </Tag>
            )}
          </HStack>
          <BodyShort className="table-subtext">
            Denne flaten er separat fra vedtak og begrunnelse til søker.
          </BodyShort>
        </VStack>

        <Alert variant="info">
          Denne merknaden er kun til internt bruk i Nav. Den deles ikke med mor, medmor eller far.
        </Alert>

        {loading && (
          <Box padding="space-24" className="empty-state" role="status">
            <HStack gap="space-12" align="center">
              <Loader size="medium" title="Henter intern merknad" />
              <BodyShort>Henter intern merknad ...</BodyShort>
            </HStack>
          </Box>
        )}

        {!loading && loadError && (
          <LocalAlert status="error" role="alert" as="div">
            <LocalAlert.Header>
              <LocalAlert.Title as="div">Kunne ikke hente intern merknad</LocalAlert.Title>
            </LocalAlert.Header>
            <LocalAlert.Content>
              <BodyShort>{loadError}</BodyShort>
            </LocalAlert.Content>
          </LocalAlert>
        )}

        {!loading && !loadError && (
          <>
            {lagretMerknad && merknad && (
              <Box
                padding="space-20"
                borderWidth="1"
                borderRadius="0"
                className="intern-merknad-card"
              >
                <VStack gap="space-8">
                  <HStack gap="space-12" align="start" justify="space-between" wrap>
                    <BodyShort weight="semibold">Lagret intern merknad</BodyShort>
                    <BodyShort size="small" className="table-subtext">
                      Oppdatert av {merknad.oppdatertAv ?? DEMO_OPPDATERT_AV} ·{' '}
                      {formatOppdatert(merknad.oppdatertTidspunkt)}
                    </BodyShort>
                  </HStack>
                  <BodyLong>{merknad.kommentar}</BodyLong>
                </VStack>
              </Box>
            )}

            <VStack gap="space-16">
              <Checkbox
                checked={komplisert}
                onChange={(event) => {
                  setKomplisert(event.target.checked);
                  if (kommentarError && (!event.target.checked || kommentar.trim())) {
                    setKommentarError(undefined);
                  }
                }}
                disabled={!isEditing || saving}
                readOnly={!isEditing}
              >
                Marker saken som komplisert eller utfordrende
              </Checkbox>

              <Textarea
                label="Intern kommentar"
                description="Bruk kommentaren til intern læring, oppfølging og forbedring av fremtidig saksbehandling."
                value={kommentar}
                onChange={(event) => {
                  setKommentar(event.target.value);
                  if (kommentarError && event.target.value.trim()) {
                    setKommentarError(undefined);
                  }
                }}
                error={kommentarError}
                maxLength={MAKS_INTERN_KOMMENTAR_TEGN}
                minRows={4}
                disabled={!isEditing || saving}
                readOnly={!isEditing}
              />

              {saveError && (
                <div ref={saveErrorRef} tabIndex={-1}>
                  <LocalAlert status="error" role="alert" as="div">
                    <LocalAlert.Header>
                      <LocalAlert.Title as="div">Kunne ikke lagre intern merknad</LocalAlert.Title>
                    </LocalAlert.Header>
                    <LocalAlert.Content>
                      <BodyShort>{saveError}</BodyShort>
                    </LocalAlert.Content>
                  </LocalAlert>
                </div>
              )}

              {isEditing ? (
                <HStack gap="space-12" align="center" wrap>
                  <Button type="button" onClick={() => void handleSave()} loading={saving}>
                    Lagre merknad
                  </Button>
                  {lagretMerknad && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      Avbryt
                    </Button>
                  )}
                </HStack>
              ) : (
                <HStack>
                  <Button type="button" onClick={startEditing}>
                    Rediger merknad
                  </Button>
                </HStack>
              )}
            </VStack>
          </>
        )}
      </VStack>
    </Box>
  );
}
