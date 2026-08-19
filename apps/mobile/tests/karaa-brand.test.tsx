import { render } from '@testing-library/react-native';

import { KaraaBrand, Logo } from '../src/components/KaraaBrand';

describe('KaraaBrand', () => {
  it.each(['wordmark', 'crown', 'lockup'] as const)('renders the local %s identity accessibly', (variant) => {
    const screen = render(<KaraaBrand variant={variant} />);
    expect(screen.getByLabelText('Karaa Global')).toBeTruthy();
    expect(screen.getByTestId(`karaa-brand-${variant}`)).toBeTruthy();
  });

  it('exports the Logo design-system alias and accepts a contextual label', () => {
    const screen = render(<Logo accessibilityLabel="Karaa Global home" height={20} />);
    expect(screen.getByLabelText('Karaa Global home')).toBeTruthy();
  });
});