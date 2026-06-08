import { type KvoterDto } from '../../../lib/foreldrepenger';

export interface KvoteSegment {
  label: string;
  shortLabel: string;
  uker: number;
  forklaring: string;
  tone: 'mother' | 'father' | 'shared' | 'bonus' | 'advance';
}

export function getKvoteSegments(kvoter: KvoterDto): KvoteSegment[] {
  return [
    {
      label: 'Forhåndskvote',
      shortLabel: 'Forhånd',
      uker: kvoter.forskuddUker,
      forklaring: 'Mor før termin',
      tone: 'advance',
    },
    {
      label: 'Mødrekvote',
      shortLabel: 'Mor',
      uker: kvoter.modrekvoteUker,
      forklaring: 'Reservert mor',
      tone: 'mother',
    },
    {
      label: 'Fedrekvote',
      shortLabel: 'Far',
      uker: kvoter.fedrekvoteUker,
      forklaring: 'Reservert far',
      tone: 'father',
    },
    {
      label: 'Fellesperiode',
      shortLabel: 'Felles',
      uker: kvoter.fellesperiodeUker,
      forklaring: 'Kan fordeles',
      tone: 'shared',
    },
    {
      label: 'Bonus/flerbarnsuker',
      shortLabel: 'Bonus',
      uker: kvoter.bonusuker,
      forklaring: 'Flerbarnstillegg',
      tone: 'bonus',
    },
  ];
}
