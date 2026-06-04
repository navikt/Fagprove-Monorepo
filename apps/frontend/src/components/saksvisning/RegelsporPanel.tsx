import { BodyLong, BodyShort, Box, Heading, HStack, Tag, VStack } from '@navikt/ds-react';
import {
  getSakLabel,
  getSakStatusLabel,
  getScenarioLabel,
  type RegelresultatDto,
  type SakResponse,
} from '../../lib/foreldrepenger';
import { getSakTagVariant } from './helpers';
import { Inntektshistorikk } from './Inntektshistorikk';

export function RegelsporPanel({ sak }: { sak: SakResponse }) {
  const statusLabel = getSakStatusLabel(sak.status, sak.vedtak);

  return (
    <Box as="section" padding="space-24" borderWidth="1" borderRadius="0">
      <VStack gap="space-24">
        <HStack gap="space-12" align="start" justify="space-between" wrap>
          <VStack gap="space-8">
            <Heading level="2" size="large">
              Regler for {getSakLabel(sak.soknad)}
            </Heading>
            <BodyLong>{getScenarioLabel(sak.soknad)}</BodyLong>
          </VStack>
          <Tag size="medium" variant={getSakTagVariant(sak)}>
            {statusLabel}
          </Tag>
        </HStack>

        <ol className="rule-timeline" aria-label="Regelspor">
          {sak.regelspor.map((regel, index) => (
            <li
              key={`${regel.regel}-${index}`}
              className="rule-timeline__item"
              data-status={regel.status}
            >
              <span className="rule-timeline__marker" aria-hidden="true">
                {getRuleIcon(regel)}
              </span>
              <VStack gap="space-4">
                <Heading level="3" size="small">
                  {getRuleTimelineTitle(regel)}
                </Heading>
                <BodyShort size="small" className="rule-timeline__detail">
                  {getRuleTimelineDetail(regel)}
                </BodyShort>
                <BodyLong>{getRuleTimelineText(regel)}</BodyLong>
              </VStack>
            </li>
          ))}
        </ol>

        <Inntektshistorikk inntekter={sak.soknad.inntekter} />
      </VStack>
    </Box>
  );
}

function getRuleTimelineTitle(regel: RegelresultatDto): string {
  const labels: Record<string, string> = {
    OPPTJENING: 'Opptjening',
    ENGANGSSTONAD: 'Engangsstønad fallback',
    BEREGNINGSGRUNNLAG: 'Beregningsgrunnlag',
    STONADSPERIODE: 'Stønadsperiode',
    KVOTEFORDELING: 'Kvote',
  };

  return labels[regel.regel] ?? regel.regel.replaceAll('_', ' ').toLowerCase();
}

function getRuleTimelineDetail(regel: RegelresultatDto): string {
  const labels: Record<string, string> = {
    OPPTJENING: 'Opptjeningskrav',
    ENGANGSSTONAD: 'Fallback',
    BEREGNINGSGRUNNLAG: 'Beregningsgrunnlag',
    STONADSPERIODE: 'Stønadsperiode',
    KVOTEFORDELING: 'Kvotefordeling',
  };

  return labels[regel.regel] ?? 'Regelvurdering';
}

function getRuleTimelineText(regel: RegelresultatDto): string {
  if (regel.regel === 'BEREGNINGSGRUNNLAG') {
    const amount = /(\d[\d\s]*)\s*kr/i.exec(regel.begrunnelse);
    return amount ? `${amount[1].replace(/\s/g, ' ')} kr` : regel.begrunnelse;
  }

  if (regel.regel === 'KVOTEFORDELING' && regel.status === 'OPPFYLT') {
    return 'Fordeling beregnet';
  }

  return regel.begrunnelse;
}

function getRuleIcon(regel: RegelresultatDto): string {
  if (regel.status === 'OPPFYLT') {
    return '✓';
  }

  const icons: Record<string, string> = {
    BEREGNINGSGRUNNLAG: '▦',
    ENGANGSSTONAD: '▤',
    KVOTEFORDELING: '▧',
    STONADSPERIODE: '◉',
  };

  return icons[regel.regel] ?? '!';
}
