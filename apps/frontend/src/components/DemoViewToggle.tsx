import { BodyShort, HStack, ToggleGroup } from '@navikt/ds-react';

export type DemoView = 'saksbehandler' | 'teamleder';

const demoViews: { value: DemoView; label: string }[] = [
  { value: 'saksbehandler', label: 'Saksbehandler' },
  { value: 'teamleder', label: 'Teamleder' },
];

interface DemoViewToggleProps {
  value: DemoView;
  onChange: (value: DemoView) => void;
}

function isDemoView(value: string): value is DemoView {
  return value === 'saksbehandler' || value === 'teamleder';
}

export function DemoViewToggle({ value, onChange }: DemoViewToggleProps) {
  return (
    <HStack gap="space-16" align="center" wrap className="demo-view-toggle">
      <BodyShort weight="semibold">Visning som</BodyShort>
      <ToggleGroup
        size="small"
        value={value}
        onChange={(next) => {
          if (isDemoView(next)) {
            onChange(next);
          }
        }}
        aria-label="Demovisning"
      >
        {demoViews.map((view) => (
          <ToggleGroup.Item key={view.value} value={view.value} label={view.label} />
        ))}
      </ToggleGroup>
      <BodyShort size="small" className="demo-view-toggle__help">
        Demovalg - ikke tilgangsstyring
      </BodyShort>
    </HStack>
  );
}
