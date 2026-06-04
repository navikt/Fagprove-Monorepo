import { useState } from 'react';
import { BodyShort, HStack, ToggleGroup } from '@navikt/ds-react';

const demoViews = [
  { value: 'saksbehandler', label: 'Saksbehandler' },
  { value: 'teamleder', label: 'Teamleder' },
];

export function DemoViewToggle() {
  const [selectedView, setSelectedView] = useState(demoViews[0].value);

  return (
    <HStack gap="space-16" align="center" wrap className="demo-view-toggle">
      <ToggleGroup
        size="small"
        value={selectedView}
        onChange={setSelectedView}
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
