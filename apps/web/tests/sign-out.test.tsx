import { fireEvent, render, screen } from '@testing-library/react';

import { App } from '../src/App';

const customerSession = {
  token: 'server-issued-token',
  user: {
    id: '30000001-0000-4000-8000-000000000001',
    email: 'anika.customer@karaa.demo',
    role: 'customer' as const,
    displayName: 'Anika Customer',
  },
};

describe('browser sign out', () => {
  it('clears the session and returns to the public tour', () => {
    render(<App initialPath="/customer" initialSession={customerSession} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(screen.getByRole('heading', { name: /evidence becomes accountable/i })).toBeInTheDocument();
    expect(sessionStorage.getItem('karaa.browser.session.v1')).toBeNull();
  });
});
