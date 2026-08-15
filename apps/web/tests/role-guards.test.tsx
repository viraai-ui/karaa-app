import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { App } from '../src/App';

vi.mock('../src/features/customer/CustomerWorkspace', () => ({
  CustomerWorkspace: () => <h1>Your customer workspace</h1>,
}));

const customerSession = {
  token: 'server-issued-token',
  user: {
    id: '30000001-0000-4000-8000-000000000001',
    email: 'anika.customer@karaa.demo',
    role: 'customer' as const,
    displayName: 'Anika Customer',
  },
};

describe('browser role guards', () => {
  it('does not render an employee workspace when the signed-in role is Customer', () => {
    render(<App initialPath="/employee" initialSession={customerSession} />);

    expect(screen.getByRole('heading', { name: 'Your customer workspace' })).toBeInTheDocument();
    expect(screen.queryByText(/employee workspace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/field locations/i)).not.toBeInTheDocument();
  });

  it('requires sign-in before a protected workspace is visible', () => {
    render(<App initialPath="/management" initialSession={null} />);

    expect(screen.getByRole('heading', { name: /sign in to the record behind the work/i })).toBeInTheDocument();
    expect(screen.queryByText(/command centre/i)).not.toBeInTheDocument();
  });
});
