import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { RoleGate } from '../src/RoleGate';
import type { Session } from '../src/lib/session';

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text: MockText } = require('react-native');
    return <MockText>{href}</MockText>;
  },
}));

const customerSession: Session = {
  token: 'token',
  expiresAt: '2033-05-18T03:33:20.000Z',
  user: { id: 'customer-1', role: 'customer' },
};

describe('RoleGate', () => {
  it('does not render a wrong-role incoming deep link and redirects to the customer URL', async () => {
    const rendered = render(
      <RoleGate requiredRole="management" loadSession={() => Promise.resolve(customerSession)}>
        <Text>Management-only content</Text>
      </RoleGate>,
    );

    expect(await rendered.findByText('/customer')).toBeTruthy();
    expect(rendered.queryByText('Management-only content')).toBeNull();
  });
});
