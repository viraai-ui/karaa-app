import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { App } from '../src/App';

vi.mock('../src/features/customer/CustomerWorkspace', () => ({
  CustomerWorkspace: () => <h1>Your customer workspace</h1>,
}));

const expiredJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.signature';

describe('expired browser session routing', () => {
  beforeEach(() => sessionStorage.clear());

  it('deletes an expired restored session before a protected workspace can render', () => {
    sessionStorage.setItem('karaa.browser.session.v1', JSON.stringify({
      token: expiredJwt,
      user: {
        id: '30000001-0000-4000-8000-000000000001',
        email: 'anika.customer@karaa.demo',
        role: 'customer',
        displayName: 'Anika Customer',
      },
    }));
    window.history.replaceState({}, '', '/customer');

    render(<App />);

    expect(screen.getByRole('heading', { name: /sign in to the record behind the work/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your customer workspace' })).not.toBeInTheDocument();
    expect(sessionStorage.getItem('karaa.browser.session.v1')).toBeNull();
  });
});
