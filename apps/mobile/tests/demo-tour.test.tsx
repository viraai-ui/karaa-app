import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const themeTokens = require('../src/theme/tokens');

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text>{href}</Text>;
  },
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../src/lib/session', () => ({
  loadSession: jest.fn(),
}));

import Index from '../app/index';
import { loadSession } from '../src/lib/session';

const mockPush = jest.fn();
const mockLoadSession = jest.mocked(loadSession);

function renderTour(insets = { top: 24, left: 0, right: 0, bottom: 16 }) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets,
      }}
    >
      <Index />
    </SafeAreaProvider>,
  );
}

describe('public Karaa tour', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadSession.mockResolvedValue(undefined);
  });

  it('renders the audience story without a saved session', async () => {
    const rendered = renderTour();

    expect(await rendered.findByText('Field evidence. Clear decisions.')).toBeTruthy();
    expect(rendered.getByText('Explore the operating loop')).toBeTruthy();
    expect(rendered.getByText('Progress recalculated')).toBeTruthy();
    expect(rendered.getByText('Customer assurance')).toBeTruthy();
    expect(rendered.getByText('Management intervention')).toBeTruthy();
    expect(rendered.getByLabelText('Demo visual: Amaravati Solar Commons')).toBeTruthy();
  });

  it('uses shared radii and a centered responsive tour column with a 16:9 demo visual', async () => {
    const rendered = renderTour();

    const columnStyle = StyleSheet.flatten((await rendered.findByTestId('tour-column')).props.style);
    const heroFrameStyle = StyleSheet.flatten(rendered.getByTestId('tour-hero-frame').props.style);
    const heroImageStyle = StyleSheet.flatten(rendered.getByTestId('tour-hero-image').props.style);

    expect(themeTokens.radii).toEqual({ sm: 10, md: 12, lg: 16, pill: 999 });
    expect(themeTokens.layout.contentMaxWidth).toBeGreaterThan(460);
    expect(columnStyle).toMatchObject({ alignSelf: 'center', maxWidth: themeTokens.layout.contentMaxWidth, width: '100%' });
    expect(heroFrameStyle).toMatchObject({ aspectRatio: 16 / 9, width: '100%' });
    expect(heroImageStyle).toMatchObject({ height: '100%', width: '100%' });
    const scrollStyle = StyleSheet.flatten(rendered.getByTestId('tour-scroll').props.style);
    expect(scrollStyle).toMatchObject({ marginTop: 24 });
  });

  it('reserves horizontal safe-area insets for a notched tour viewport', async () => {
    const rendered = renderTour({ top: 24, left: 18, right: 14, bottom: 16 });

    await rendered.findByText('Field evidence. Clear decisions.');
    const contentStyle = StyleSheet.flatten(rendered.getByTestId('tour-scroll').props.contentContainerStyle);

    expect(contentStyle).toMatchObject({
      paddingLeft: themeTokens.spacing.lg + 18,
      paddingRight: themeTokens.spacing.lg + 14,
    });
  });

  it('takes the public-tour sign-in CTA to login', async () => {
    const rendered = renderTour();

    const signIn = await rendered.findByRole('button', { name: 'Sign in to try your workspace' });
    fireEvent.press(signIn);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
