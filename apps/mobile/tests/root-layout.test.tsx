import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  const Stack = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
  Stack.Screen = () => null;

  return { Stack };
});

jest.mock('expo-status-bar', () => {
  const { View } = require('react-native');
  return {
    StatusBar: (props: Record<string, unknown>) => <View testID="root-status-bar" {...props} />,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
      <View testID="root-safe-area-provider">{children}</View>
    ),
  };
});

import RootLayout from '../app/_layout';

describe('RootLayout', () => {
  it('uses a light system status bar over Karaa’s dark app chrome', () => {
    const rendered = render(<RootLayout />);

    expect(rendered.getByTestId('root-safe-area-provider')).toBeTruthy();
    expect(rendered.getByTestId('root-status-bar').props.style).toBe('light');
  });
});
