import { render, screen } from '@testing-library/react';

import { App } from '../src/App';

describe('public Karaa tour', () => {
  it('renders the operating loop before any authentication', () => {
    render(<App initialPath="/" />);

    expect(screen.getByRole('heading', { name: /evidence becomes accountable/i })).toBeInTheDocument();
    const signInLinks = screen.getAllByRole('link', { name: /sign in to your workspace/i });
    expect(signInLinks).toHaveLength(2);
    signInLinks.forEach((link) => expect(link).toHaveAttribute('href', '/sign-in'));
    expect(screen.getByText(/secure online service/i)).toBeInTheDocument();
  });
});
