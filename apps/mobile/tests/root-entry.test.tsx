import { render } from '@testing-library/react-native';
import { RootEntry } from '../src/RootEntry';

jest.mock('expo-router', () => ({ Redirect: () => null }));

describe('RootEntry', () => {
  it('opens the public web build on the customer dashboard', () => {
    const WebIndex = require('../app/index.web').default;
    const { Redirect } = require('expo-router');
    const rendered = render(<WebIndex />);

    expect(rendered.UNSAFE_getByType(Redirect).props.href).toBe('/demo/customer');
  });

  it('routes demo builds to the presentation selector rather than the public tour', () => {
    process.env.EXPO_PUBLIC_KARAA_DEMO_MODE = 'true';
    jest.resetModules();
    const Index = require('../app/index').default;
    const { Redirect } = require('expo-router');
    const rendered = render(<Index />);

    expect(rendered.UNSAFE_getByType(Redirect).props.href).toBe('/login');
  });

  it('lands an authenticated management user in the command centre rather than a role selector', async () => {
    const rendered = await render(<RootEntry session={{
      token: 'token',
      expiresAt: '2033-05-18T03:33:20.000Z',
      user: { id: 'm1', role: 'management' },
    }} />);

    expect(rendered.getByText('Command Centre')).toBeTruthy();
    expect(rendered.queryByText('Choose your role')).toBeNull();
  });
});
