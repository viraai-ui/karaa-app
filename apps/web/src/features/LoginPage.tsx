import { useState, type FormEvent } from 'react';

import type { BrowserSession } from '../lib/session';

export type LoginInput = { email: string; password: string };

type LoginPageProps = {
  authenticate: (input: LoginInput) => Promise<BrowserSession>;
  onAuthenticated: (session: BrowserSession) => void;
};

function messageFrom(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : 'Karaa could not sign you in.';
}

type DemoAccount = {
  label: string;
  email: string;
  focus: string;
};

const demoAccounts: DemoAccount[] = [
  { label: 'Customer', email: 'anika.customer@karaa.demo', focus: 'progress, evidence, records & support' },
  { label: 'Employee', email: 'dev.employee@karaa.demo', focus: 'field record, evidence & accountable reply' },
  { label: 'Management', email: 'mira.management@karaa.demo', focus: 'locations, interventions & field thread' },
];

function walkthroughLabel(account: DemoAccount): string {
  return `${account.label} walkthrough`;
}

export function LoginPage({ authenticate, onAuthenticated }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await authenticate({ email: email.trim(), password });
      onAuthenticated(session);
    } catch (reason) {
      setError(messageFrom(reason));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <a className="wordmark" href="/">KARAA</a>
      <section className="auth-panel" aria-labelledby="sign-in-title">
        <p className="eyebrow">Secure workspace entry</p>
        <h1 id="sign-in-title">Sign in to the record behind the work.</h1>
        <p className="auth-copy">Your role is assigned by the server. There is no role selector here.</p>
        <section className="demo-walkthroughs" aria-labelledby="demo-walkthroughs-title">
          <div>
            <p className="eyebrow">Audience demo</p>
            <h2 id="demo-walkthroughs-title">Choose a demo walkthrough</h2>
          </div>
          <div className="demo-account-grid">
            {demoAccounts.map((account) => (
              <button
                className="demo-account"
                key={account.label}
                type="button"
                aria-label={walkthroughLabel(account)}
                onClick={() => {
                  setEmail(account.email);
                  setPassword('demo-password');
                  setError(null);
                }}
              >
                <strong>{account.label}</strong>
                <span>{account.focus}</span>
                <span className="demo-account-action">Use server-backed demo account</span>
              </button>
            ))}
          </div>
        </section>
        <form onSubmit={submit} noValidate>
          <label>
            <span>Email</span>
            <input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button button-primary" disabled={submitting} type="submit">{submitting ? 'Signing in…' : 'Sign in to Karaa'}</button>
        </form>
        <p className="auth-boundary">Karaa runs on a secure online service. Project data and actions require a connection; this browser does not retain project data or queue changes.</p>
      </section>
    </main>
  );
}
