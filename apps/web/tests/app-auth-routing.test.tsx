import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach } from 'vitest';

import { App } from '../src/App';

const mocks = vi.hoisted(() => ({ authenticate: vi.fn() }));

vi.mock('../src/lib/api', () => ({ authenticate: mocks.authenticate }));

describe('authenticated browser routing', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mocks.authenticate.mockReset();
  });

  it('uses the server-selected Customer role after a real sign-in response', async () => {
    mocks.authenticate.mockResolvedValue({
      token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo0MTAyNDQ0ODAwfQ.signature',
      user: {
        id: '30000001-0000-4000-8000-000000000001',
        email: 'anika.customer@karaa.demo',
        role: 'customer',
        displayName: 'Anika Customer',
      },
    });
    window.history.replaceState({}, '', '/sign-in');
    render(<App />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'anika.customer@karaa.demo' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'demo-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to Karaa' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Your customer workspace' })).toBeInTheDocument());
    expect(window.location.pathname).toBe('/customer');
    expect(sessionStorage.getItem('karaa.browser.session.v1')).toContain('customer');
  });
});
