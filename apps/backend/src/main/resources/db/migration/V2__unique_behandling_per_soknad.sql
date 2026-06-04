DROP INDEX IF EXISTS idx_behandling_soknad_id;

CREATE UNIQUE INDEX IF NOT EXISTS behandling_soknad_id_key
    ON behandling (soknad_id);
