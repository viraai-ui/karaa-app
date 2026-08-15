import { useState, type ReactNode } from 'react';

import { CustomerWorkspace } from './features/customer/CustomerWorkspace';
import { EmployeeWorkspace } from './features/employee/EmployeeWorkspace';
import { LoginPage } from './features/LoginPage';
import { ManagementWorkspace } from './features/management/ManagementWorkspace';
import { authenticate } from './lib/api';
import { clearSession, readSession, writeSession, type BrowserSession } from './lib/session';

export type AppProps = {
  initialPath?: string;
  initialSession?: BrowserSession | null;
};

type RouteLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
};

function RouteLink({ href, children, className, ...rest }: RouteLinkProps) {
  return <a className={className} href={href} {...rest}>{children}</a>;
}

function EvidenceRail() {
  const steps = [
    ['01', 'Evidence', 'A field record begins with work described, a single image, and disclosed provenance.'],
    ['02', 'Progress', 'The secure Karaa API accepts the record and recalculates the authorized project view.'],
    ['03', 'Decision', 'Customers understand what changed. Management sees where an accountable action is needed.'],
  ];

  return (
    <ol className="evidence-rail" aria-label="Karaa operating loop">
      {steps.map(([number, title, detail]) => (
        <li key={number}>
          <span aria-hidden="true">{number}</span>
          <div>
            <strong>{title}</strong>
            <p>{detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function PublicTour() {
  return (
    <main className="public-tour">
      <header className="tour-header">
        <RouteLink href="/" className="wordmark" aria-label="Karaa home">KARAA</RouteLink>
        <RouteLink href="/sign-in" className="text-link">Sign in</RouteLink>
      </header>

      <section className="tour-hero" aria-labelledby="tour-title">
        <div className="hero-copy">
          <p className="eyebrow">Construction intelligence / audience walk-through</p>
          <h1 id="tour-title">Evidence becomes accountable.</h1>
          <p className="lede">Karaa connects a field record to the people who need to understand it, act on it, and stand behind it.</p>
          <div className="hero-actions">
            <RouteLink href="#operating-loop" className="button button-primary">Explore the operating loop</RouteLink>
            <RouteLink href="/sign-in" className="button button-quiet">Sign in to your workspace</RouteLink>
          </div>
        </div>
        <figure className="hero-visual">
          <img src="/assets/amaravati-hero.png" alt="Generated visual of the fictional Amaravati Solar Commons construction site" />
          <figcaption>Demo visual · fictional Amaravati Solar Commons</figcaption>
        </figure>
      </section>

      <section id="operating-loop" className="operating-loop" aria-labelledby="loop-title">
        <div className="section-intro">
          <p className="eyebrow">One project record, three accountable views</p>
          <h2 id="loop-title">The operating loop stays visible.</h2>
          <p>It is not an activity feed. Every role gets the next useful view after an API-backed action is accepted.</p>
        </div>
        <EvidenceRail />
      </section>

      <section className="role-proof" aria-labelledby="roles-title">
        <div className="section-intro">
          <p className="eyebrow">Role-safe workspaces</p>
          <h2 id="roles-title">The same record answers different questions.</h2>
        </div>
        <div className="role-lines">
          <article>
            <p className="role-index">Employee / 01</p>
            <h3>Record completed work with evidence.</h3>
            <p>One image, a progress claim, site conditions, a next accountable action, and honest presentation-location provenance.</p>
          </article>
          <article>
            <p className="role-index">Customer / 02</p>
            <h3>Understand the delivery record.</h3>
            <p>Authorized progress, evidence, fictional demo records with clear disclaimers, and a persisted support thread.</p>
          </article>
          <article>
            <p className="role-index">Management / 03</p>
            <h3>Choose the next intervention.</h3>
            <p>Project health, authorized field locations, accountable interventions, and direct field follow-up.</p>
          </article>
        </div>
      </section>

      <section className="online-boundary" aria-label="Karaa online service boundary">
        <p className="eyebrow">Service boundary</p>
        <p><strong>Karaa runs on a secure online service.</strong> If the service cannot be reached, project data and actions remain unavailable until the connection is restored. A browser retains only the signed-in session for the current tab session; it does not retain project data or queue writes.</p>
      </section>

      <footer className="tour-footer">
        <p>Karaa / project intelligence for accountable delivery</p>
        <RouteLink href="/sign-in" className="button button-primary">Sign in to your workspace</RouteLink>
      </footer>
    </main>
  );
}

function rolePath(session: BrowserSession): string {
  return `/${session.user.role}`;
}

function replacePath(path: string): void {
  if (typeof window !== 'undefined') window.history.replaceState({}, '', path);
}

export function App({ initialPath, initialSession }: AppProps) {
  const initialRoute = initialPath ?? (typeof window === 'undefined' ? '/' : window.location.pathname);
  const [path, setPath] = useState(initialRoute);
  const [session, setSession] = useState<BrowserSession | null>(() => initialSession === undefined ? readSession() : initialSession);

  function onAuthenticated(nextSession: BrowserSession) {
    writeSession(nextSession);
    setSession(nextSession);
    replacePath(rolePath(nextSession));
    setPath(rolePath(nextSession));
  }

  function onSignOut() {
    clearSession();
    setSession(null);
    replacePath('/');
    setPath('/');
  }

  if (path === '/') return <PublicTour />;

  if (!session) return <LoginPage authenticate={authenticate} onAuthenticated={onAuthenticated} />;

  if (path !== rolePath(session)) {
    replacePath(rolePath(session));
  }

  if (session.user.role === 'customer') return <CustomerWorkspace session={session} onSignOut={onSignOut} />;
  if (session.user.role === 'employee') return <EmployeeWorkspace session={session} onSignOut={onSignOut} />;
  return <ManagementWorkspace session={session} onSignOut={onSignOut} />;
}
