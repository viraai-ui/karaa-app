import { act, render, screen } from '@testing-library/react';

import { MobileExperienceGate } from '../src/components/MobileExperienceGate';

describe('mobile experience gate', () => {
  it('shows only the mobile guidance on desktop and responds to viewport changes', () => {
    let matches = false;
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const query = {
      get matches() { return matches; },
      media: '(max-width: 900px)',
      onchange: null,
      addEventListener: (_type: string, next: (event: MediaQueryListEvent) => void) => { listener = next; },
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList;
    vi.stubGlobal('matchMedia', vi.fn(() => query));

    render(<MobileExperienceGate><p>Mobile application</p></MobileExperienceGate>);
    expect(screen.getByRole('heading', { name: /please use Karaa on your mobile device/i })).toBeVisible();
    expect(screen.queryByText('Mobile application')).not.toBeInTheDocument();

    matches = true;
    act(() => listener?.({ matches: true } as MediaQueryListEvent));
    expect(screen.getByText('Mobile application')).toBeVisible();
  });
});
