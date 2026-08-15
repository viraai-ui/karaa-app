import { useEffect, useState, type ReactNode } from 'react';

const MOBILE_QUERY = '(max-width: 900px)';

function isMobileViewport(): boolean {
  return typeof window === 'undefined' || typeof window.matchMedia !== 'function'
    ? true
    : window.matchMedia(MOBILE_QUERY).matches;
}

export function DesktopNotice() {
  return (
    <main className="desktop-notice" aria-labelledby="desktop-notice-title">
      <div className="desktop-notice-glow" aria-hidden="true" />
      <section className="desktop-notice-card">
        <div className="desktop-notice-mark" aria-hidden="true">K</div>
        <p className="desktop-notice-wordmark">KARAA</p>
        <p className="desktop-notice-eyebrow">Built for work in motion</p>
        <h1 id="desktop-notice-title">Please use Karaa on your mobile device.</h1>
        <p className="desktop-notice-copy">
          Karaa is a mobile-first field application. Open this address on your phone, or install the application there, to continue.
        </p>
        <div className="desktop-notice-device" aria-hidden="true">
          <span />
          <div><strong>Open on mobile</strong><small>Field evidence. Clear decisions.</small></div>
        </div>
      </section>
      <p className="desktop-notice-footer">Karaa · accountable delivery</p>
    </main>
  );
}

export function MobileExperienceGate({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(isMobileViewport);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = (event: MediaQueryListEvent) => setMobile(event.matches);
    setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return mobile ? children : <DesktopNotice />;
}
