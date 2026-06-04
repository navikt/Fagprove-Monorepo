import { BodyLong, BodyShort, Heading, VStack } from '@navikt/ds-react';
import { type RegelresultatDto } from '../../lib/foreldrepenger';

interface RegelsporTimelineProps {
  regelspor: RegelresultatDto[];
}

export function RegelsporTimeline({ regelspor }: RegelsporTimelineProps) {
  return (
    <ol className="rule-timeline" aria-label="Regelspor">
      {regelspor.map((regel, index) => (
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
