-- Enkel baseline for backend-databasen.
-- Pending manuell vurdering lagres i behandling.status og regelresultat.status,
-- ikke som en egen vedtakstype.

-- Eksempeltabell for dagens city-API.
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    population INT NOT NULL
);

-- Eksempeltabell for dagens user-API.
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    age INT NOT NULL
);

-- Søknad lagrer det frontend trenger for å starte en foreldrepengesak.
CREATE TABLE IF NOT EXISTS soknad (
    id UUID PRIMARY KEY,
    fnr VARCHAR(11) NOT NULL,
    er_norsk_borger BOOLEAN NOT NULL,
    termindato DATE NOT NULL,
    rettsforhold VARCHAR(32) NOT NULL,
    dekningsgrad VARCHAR(32) NOT NULL,
    antall_barn INT NOT NULL,
    oppgitt_aarsinntekt_kroner INT NOT NULL,
    innsendt DATE NOT NULL
);

-- Inntektsregistrering lagrer månedlige inntekter som hører til en søknad.
CREATE TABLE IF NOT EXISTS inntektsregistrering (
    id BIGSERIAL PRIMARY KEY,
    soknad_id UUID NOT NULL REFERENCES soknad(id),
    maned DATE NOT NULL,
    inntektstype VARCHAR(32) NOT NULL,
    belop_kroner INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inntektsregistrering_soknad_id
    ON inntektsregistrering (soknad_id);

-- Behandling lagrer status og tidspunkt for saksbehandlingen av en søknad.
CREATE TABLE IF NOT EXISTS behandling (
    id BIGSERIAL PRIMARY KEY,
    soknad_id UUID NOT NULL REFERENCES soknad(id),
    status VARCHAR(32) NOT NULL,
    opprettet_tidspunkt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ferdigstilt_tidspunkt TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_behandling_soknad_id
    ON behandling (soknad_id);

-- Regelresultat lagrer spor av hvilke regler som ble kjørt i en behandling.
CREATE TABLE IF NOT EXISTS regelresultat (
    id BIGSERIAL PRIMARY KEY,
    behandling_id BIGINT NOT NULL REFERENCES behandling(id),
    rekkefolge INT NOT NULL,
    regelnavn VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    begrunnelse TEXT NOT NULL,
    UNIQUE (behandling_id, rekkefolge)
);

CREATE INDEX IF NOT EXISTS idx_regelresultat_behandling_id
    ON regelresultat (behandling_id);

-- Vedtak lagrer bare endelig beslutning for en ferdig behandling.
CREATE TABLE IF NOT EXISTS vedtak (
    behandling_id BIGINT PRIMARY KEY REFERENCES behandling(id),
    type VARCHAR(32) NOT NULL,
    belop_kroner INT,
    beregningsgrunnlag_kroner INT,
    stonadsperiode_fom DATE,
    stonadsperiode_tom DATE,
    stonadsperiode_uker INT,
    modrekvote_uker INT,
    fedrekvote_uker INT,
    fellesperiode_uker INT,
    bonusuker INT,
    forskudd_uker INT,
    begrunnelse TEXT NOT NULL,
    besluttet_av VARCHAR(100) NOT NULL,
    besluttet_tidspunkt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
