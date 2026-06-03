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

CREATE TABLE IF NOT EXISTS inntektsregistrering (
    id BIGSERIAL PRIMARY KEY,
    soknad_id UUID NOT NULL REFERENCES soknad(id),
    maned DATE NOT NULL,
    inntektstype VARCHAR(32) NOT NULL,
    belop_kroner INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inntektsregistrering_soknad_id
    ON inntektsregistrering (soknad_id);

CREATE TABLE IF NOT EXISTS behandling (
    id BIGSERIAL PRIMARY KEY,
    soknad_id UUID NOT NULL REFERENCES soknad(id),
    status VARCHAR(32) NOT NULL,
    opprettet_tidspunkt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ferdigstilt_tidspunkt TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_behandling_soknad_id
    ON behandling (soknad_id);

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
