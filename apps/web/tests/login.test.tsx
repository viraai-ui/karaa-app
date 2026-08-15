import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LoginPage } from '../src/features/LoginPage';

const employeeSession = {
  token: 'server-issued-token',
  user: {
    id: '30000002-0000-4000-8000-000000000002',
    email: 'dev.employee@karaa.demo',
    role: 'employee' as const,
    displayName: 'Dev Employee',
  },
};

describe('Karaa browser sign in', () => {
  it('offers the three server-backed demo accounts as explicit audience walkthrough starting points', () => {
    render(<LoginPage authenticate={vi.fn()} onAuthenticated={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Choose a demo walkthrough' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Customer walkthrough' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Employee walkthrough' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Management walkthrough' })).toBeInTheDocument();
  });

  it('submits credentials and routes by the server-returned role', async () => {
    const authenticate = vi.fn().mockResolvedValue(employeeSession);
    const onAuthenticated = vi.fn();
    render(<LoginPage authenticate={authenticate} onAuthenticated={onAuthenticated} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dev.employee@karaa.demo' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'demo-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to Karaa' }));

    await waitFor(() => expect(authenticate).toHaveBeenCalledWith({
      email: 'dev.employee@karaa.demo',
      password: 'demo-password',
    }));
    expect(onAuthenticated).toHaveBeenCalledWith(employeeSession);
    expect(screen.getByText(/role is assigned by the server/i)).toBeInTheDocument();
  });

  it('shows the approved connection message when authentication cannot reach the API', async () => {
    const authenticate = vi.fn().mockRejectedValue(new Error('Connection unavailable — try again.'));
    render(<LoginPage authenticate={authenticate} onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'anika.customer@karaa.demo' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'demo-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to Karaa' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable — try again.');
  });
});
