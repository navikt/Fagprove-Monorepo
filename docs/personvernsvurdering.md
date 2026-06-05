# Personvernsvurdering

Siden løsningen handler om foreldrepenger, er det naturlig å tenke litt rundt personvern. I en ekte Nav-løsning ville dette vært ganske viktig, siden systemet kunne hatt fødselsnummer, inntekt, vedtak og andre opplysninger om brukere. I min løsning bruker jeg derimot kun testdata, så derfor har jeg vurdert personvernrisikoen som mye lavere enn den ville vært i produksjon.

Formålet med personvernsvurderingen er å se hvilke data løsningen håndterer, hvorfor de trengs, og hva jeg bør passe på dersom løsningen skulle blitt mer realistisk senere. Selv om det bare er testdata, prøver jeg å behandle det som om det ligner ekte saksdata, fordi det gjør løsningen mer ryddig og realistisk.

## Hvilke data løsningen håndterer

| Datatype | Eksempel | Hvorfor brukes det? |
|---|---|---|
| Identifikasjon | Test-fødselsnummer | Brukes for å knytte søknaden til en testperson. |
| Saksdata | Termindato, antall barn, rettsforhold og dekningsgrad | Brukes for å beregne periode og kvoter. |
| Inntektsdata | Oppgitt årsinntekt og inntektshistorikk | Brukes for å sjekke opptjening og beregningsgrunnlag. |
| Regeldata | Resultat fra hver regel | Brukes for å vise regelspor til saksbehandler. |
| Vedtaksdata | Innvilget, engangsstønad, avslag eller til manuell vurdering | Brukes for å vise resultatet av behandlingen. |
| Manuell behandling | Begrunnelse og tidspunkt | Brukes for å kunne se hva som ble gjort manuelt. |

## Innlogging og avgrensning

Jeg har valgt å ikke legge inn innlogging i løsningen, fordi applikasjonen kun bruker testdata og ikke ekte personopplysninger. For denne fagprøven er fokuset mitt på regelmotoren, saksbehandlingsflyten, frontend og database, ikke på å lage en komplett innloggingsløsning.

Hvis dette hadde vært en ekte løsning med ekte Nav-brukere, måtte jeg selvfølgelig hatt innlogging, rollebasert tilgang og kontroll på hvem som kunne se og behandle saker.

## Dataflyt

Dataflyten er ganske enkel. Frontend henter data fra backend, backend kjører søknaden gjennom regelmotoren, og databasen lagrer søknad, inntektshistorikk, behandling, regelresultater og vedtak.

Frontend skal ikke regne ut reglene selv, men bare vise det backend har vurdert. Dette gjør at regelmotoren ligger ett sted, og at frontend ikke kan vise et annet resultat enn backend.

## Personvernrisikoer

Jeg tenkte også på hva som kan gå galt med personvern selv om det bare er testdata. For eksempel bør fødselsnummer ikke logges unødvendig, API-et bør ikke sende mer data enn frontend faktisk trenger, og manuelle beslutninger bør lagres så man kan se hva som har skjedd i saken.

| Risiko | Hva kan skje? | Tiltak |
|---|---|---|
| Test-fødselsnummer blir logget | Man får dårlige vaner, og det ville vært farlig med ekte data. | Ikke logge fødselsnummer unødvendig. |
| For mye data sendes til frontend | Frontend får mer informasjon enn den trenger. | Lage tydelige API-responser og bare sende nødvendig data. |
| Manglende innlogging | Lav risiko i fagprøven, men ville vært alvorlig med ekte data. | Ikke prioritert nå siden det kun er testdata. I ekte løsning måtte det vært innlogging. |
| Feil regelresultat | Søknaden kan få feil resultat. | Teste regelmotoren og vise tydelig regelspor. |
| Manuell behandling mangler sporbarhet | Vanskelig å se hva som ble gjort manuelt. | Lagre begrunnelse, tidspunkt og resultat. |

## Innebygd personvern

I henhold til GDPR artikkel 25 om innebygd personvern (privacy by design) skal personvern designes inn i løsningen fra starten.

I praksis betyr dette i min løsning:

- API-responser returnerer ikke mer data enn frontend trenger.
- Fødselsnummer logges ikke unødvendig.
- Intern merknadsinformasjon holdes adskilt fra ordinær saksdata.
- Frontend viser regelspor og vedtak fra backend, men regner ikke ut reglene selv.
- Manuelle beslutninger lagres med begrunnelse, tidspunkt og resultat.

Jeg valgte å ikke implementere innlogging i denne versjonen fordi løsningen kun bruker testdata og det er utenfor fagprøvens omfang. En reell produksjonsversjon ville krevd AAD/Entra ID, rollebasert tilgangsstyring (RBAC) og session-håndtering. Dette valget er bevisst og dokumentert.

## Vurdering

Personvernrisikoen er lavere i denne fagprøven enn i en ekte produksjonsløsning, fordi det bare brukes testdata. Likevel har jeg vurdert dataene som om de ligner ekte saksdata. Det gjør at jeg får øvd på riktige prinsipper, som dataminimering, sporbarhet og trygg behandling av personopplysninger.

Det viktigste for denne løsningen er at frontend ikke får mer data enn nødvendig, at fødselsnummer ikke logges, at regelmotoren testes, og at manuelle beslutninger lagres med nok informasjon til at man kan forstå hva som har skjedd.

## Kompetansemål

- Planlegge, utvikle og dokumentere løsninger med innebygd personvern og sikkerhet – DPIA og privacy by design.
- Gjøre rede for og anvende gjeldende regelverk for personvern, opphavsrett og informasjonssikkerhet – GDPR artikkel 25.
- Håndtere påloggingsopplysninger på en sikker og forsvarlig måte – begrunnelse for fravalg av innlogging og beskrivelse av produksjonskrav.
