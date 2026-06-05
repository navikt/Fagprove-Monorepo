# Risikoanalyse

Målet med analysen var å få oversikt over hvilke risikoer som kan påvirke systemet, både teknisk og funksjonelt.

Jeg tok utgangspunkt i de viktigste delene av løsningen: API-et, regelmotoren, databasen, personopplysninger og manuell saksbehandling. Siden systemet håndterer søknader med fødselsnummer, inntekt og vedtak, var personvern og riktig behandling spesielt viktig å vurdere.

## Omfang og formål med risikovurderingen

Denne risikovurderingen gjelder foreldrepenger-løsningen som utvikles i fagprøven. Systemet er et forenklet saksbehandlingssystem hvor en saksbehandler kan se søknader om foreldrepenger, kjøre søknaden gjennom en regelmotor, se regelspor og behandle saker som eventuelt må vurderes manuelt.

Formålet med risikovurderingen er å vurdere risiko knyttet til intern forretningslogikk, datalagring, API-bruk, personopplysninger og robusthet mot feil eller ytre påvirkninger. Risikovurderingen skal bidra til å avklare hvilke tiltak som bør prioriteres i løsningen, for eksempel testing av regelmotoren, logging, feilhåndtering, tilgangskontroll og trygg lagring av data.

Systemet støtter prosessen fra mottatt søknad til resultat fra regelmotoren og eventuelt endelig vedtak etter manuell behandling. Brukergruppen er primært saksbehandlere. Løsningen behandler testdata som ligner reelle saksdata, blant annet fødselsnummer, inntektshistorikk, termindato, rettsforhold, dekningsgrad, regelresultater og vedtak. Dette regnes som personopplysninger og økonomiske data, og må derfor behandles som sensitive data selv om løsningen er forenklet.

Systemet består av en frontend bygget med Astro, TypeScript og Aksel, en backend bygget med Kotlin og Ktor, og en PostgreSQL-database. Frontend kommuniserer med backend via HTTP/JSON. Backend eksponerer API-er for å hente søknader, starte behandling, vise regelspor og lagre manuelle beslutninger. Backend kjører regelmotoren og lagrer søknader, inntektshistorikk, behandlinger, regelresultater og endelige vedtak i databasen.

I denne fagprøveløsningen er systemet tenkt som en intern applikasjon. Tilgang bør begrenses til saksbehandlere, og ved en reell produksjonssetting ville tilgangskontroll typisk vært håndtert med AAD/Entra ID, tokens/sessions og rollebasert tilgang. Secrets som databasepassord og API-nøkler skal ikke ligge i kildekoden, men håndteres via miljøvariabler eller hemmelighetshåndtering i kjøremiljøet.

Logging og monitorering bør dekke tekniske feil, API-feil og viktige hendelser i saksbehandlingen, men uten å logge fødselsnummer eller unødvendige personopplysninger. For sporbarhet bør systemet lagre hvem som tok en manuell beslutning, tidspunkt og begrunnelse. Data bør sikres med tilgangskontroll, databasevalidering og backup. Ved feil må systemet kunne gjenopprettes fra kode, databasebackup og dokumenterte prosesser.

Risikovurderingen omfatter frontend, backend, API-grensesnittet, databasen, regelmotoren og manuell saksbehandling. Den omfatter ikke Navs faktiske foreldrepengesystemer, reelle eksterne registre eller produksjonsmiljøer. Vurderingen er derfor avgrenset til fagprøvens forenklede løsning og de risikoene som er relevante for denne applikasjonen.

## ROS-analyse

| Risiko | Hva kan skje? | Tiltak |
|---|---|---|
| Misbruk og spam mot API-et | Dersom noen sender mange forespørsler, kan API-et bli tregt eller utilgjengelig. | Rate limiting på API-ruter og i frontend. Frontend bør ikke sende unødvendige kall. |
| Avhengighet til eksterne API-er | Hvis eksterne API-er eller avhengigheter feiler, kan data mangle eller bruker kan få teknisk feil. | Timeout på requests og fallback-meldinger dersom noe feiler. |
| Feil i regelmotoren | Hvis regelmotoren vurderer opptjening, beregningsgrunnlag eller kvoter feil, kan søker få feil resultat. Systemet kan ende med feil innvilgelse, feil avslag eller feil manuell vurdering. | Enhetstester for alle regelutfall. Testdata for happy path, avslag, engangsstønad og manuell vurdering. Vise tydelig regelspor i frontend. |
| Feil lagring i databasen | Dersom behandling, regelresultater eller vedtak ikke blir lagret riktig, mister man sporbarhet og historikk. | Transaksjoner ved lagring, databasevalidering, feilhåndtering og logging. |
| Saker til manuell vurdering blir glemt | Saker som krever manuell behandling kan bli liggende uten at saksbehandler følger dem opp. | Tydelig status på behandlingen. Frontend bør vise egen oversikt over saker som krever manuell behandling. |
| Fødselsnummer eller personopplysninger logges | Personopplysninger kan havne i logger eller feilmeldinger. Selv med testdata gir dette dårlige vaner. | Ikke logge fødselsnummer eller unødvendige personopplysninger. Bruke trygg feilhåndtering. |
| For mye data sendes til frontend | Frontend kan få mer informasjon enn den faktisk trenger. | API-responser bør være tydelige og bare sende nødvendig data. |
| Manglende tilgangskontroll | I en ekte løsning kunne uvedkommende fått tilgang til saker. | I fagprøven brukes testdata. I produksjon måtte løsningen hatt AAD/Entra ID, tokens/sessions og rollebasert tilgang. |
| Manuell behandling mangler sporbarhet | Det blir vanskelig å se hva som ble gjort manuelt og hvorfor. | Lagre hvem som tok beslutningen, tidspunkt og begrunnelse. |

## Viktigste risiko

Den viktigste risikoen jeg identifiserte var feil i regelmotoren. Hvis regelmotoren vurderer opptjening, beregningsgrunnlag eller kvoter feil, kan søker få feil resultat. Dette kan få store konsekvenser, siden systemet kan ende med feil innvilgelse, feil avslag eller feil manuell vurdering.

Tiltakene her ble å lage enhetstester for alle regelutfall, bruke testdata for happy path, avslag, engangsstønad og manuell vurdering, og vise tydelig regelspor i frontend.

Jeg vurderte også risiko rundt lagring i databasen. Dersom behandling, regelresultater eller vedtak ikke blir lagret riktig, mister man sporbarhet og historikk. Derfor ble tiltakene transaksjoner ved lagring, databasevalidering, feilhåndtering og logging.

I tillegg la jeg inn en risiko for at saker til manuell vurdering kan bli glemt. For å redusere dette bør behandlingen ha tydelig status, og frontend bør vise en egen oversikt over saker som krever manuell behandling.

## Konklusjon

ROS-analysen hjalp meg med å se hvilke deler av løsningen som er mest kritiske. Den gjorde det også lettere å prioritere tiltak som gir mest verdi, som tester av regelmotoren, god feilhåndtering, sikker behandling av personopplysninger og tydelig sporbarhet i databasen.

## Kompetansemål

- Planlegge, utvikle og dokumentere løsninger med innebygd personvern og sikkerhet – ROS-analysen er grunnlaget for sikkerhetstiltakene.
- Gjøre rede for og anvende gjeldende regelverk for personvern, opphavsrett og informasjonssikkerhet – GDPR artikkel 5 og personopplysningsloven.
- Behandle bedriftsinterne opplysninger på en sikker og etisk forsvarlig måte – tiltak mot unødvendig logging og dataminimering i API-responser.
