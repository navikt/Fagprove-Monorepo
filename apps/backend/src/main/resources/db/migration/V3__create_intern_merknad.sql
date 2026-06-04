CREATE TABLE IF NOT EXISTS intern_merknad (
    id BIGSERIAL PRIMARY KEY,
    behandling_id BIGINT NOT NULL REFERENCES behandling(id) ON DELETE CASCADE,
    komplisert BOOLEAN NOT NULL DEFAULT FALSE,
    kommentar TEXT NOT NULL DEFAULT '',
    oppdatert_av VARCHAR(100) NOT NULL,
    oppdatert_tidspunkt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT intern_merknad_behandling_id_key UNIQUE (behandling_id),
    CONSTRAINT intern_merknad_komplisert_kommentar_check CHECK (
        NOT komplisert OR btrim(kommentar) <> ''
    )
);

CREATE INDEX IF NOT EXISTS idx_intern_merknad_oppdatert_tidspunkt
    ON intern_merknad (oppdatert_tidspunkt DESC);
