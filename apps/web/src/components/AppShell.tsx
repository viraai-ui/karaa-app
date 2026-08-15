import type { ReactNode } from 'react';

import type { BrowserSession } from '../lib/session';

type AppShellProps = {
  session: BrowserSession;
  title: string;
  eyebrow: string;
  children: ReactNode;
  onSignOut: () => void;
};

const roleLabels = {
  customer: 'Customer assurance',
  employee: 'Field record',
  management: 'Management command',
} as const;

export function AppShell({ session, title, eyebrow, children, onSignOut }: AppShellProps) {
  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <a className="wordmark" href="/" onClick={(event) => event.preventDefault()}>KARAA</a>
        <div className="session-summary">
          <span>{roleLabels[session.user.role]}</span>
          <button className="text-button" type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </header>
      <section className="workspace-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <p className="identity">Signed in as <strong>{session.user.displayName}</strong><br />{session.user.email}</p>
      </section>
      {children}
    </main>
  );
}
