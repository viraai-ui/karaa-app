import { useCallback, useEffect, useMemo, useState } from 'react';

import type { BrowserSession } from '../../lib/session';
import { AppShell } from '../../components/AppShell';
import {
  loadEmployeeWorkspace,
  persistSimulatedFieldLocation,
  publishEmployeeFieldRecord,
  type EmployeeProjectRecord,
  type FieldRecordDraft,
} from './employee-api';

type FormState = {
  workDescription: string;
  claimedProgress: string;
  crewCount: string;
  crewHours: string;
  quantityValue: string;
  quantityUnit: string;
  siteConditions: string;
  blocker: string;
  nextAction: string;
};

type WorkspaceState =
  | { kind: 'loading' }
  | { kind: 'ready'; record: EmployeeProjectRecord; conversation: Awaited<ReturnType<typeof loadEmployeeWorkspace>>['conversation'] }
  | { kind: 'error'; message: string };

const emptyForm: FormState = {
  workDescription: '', claimedProgress: '', crewCount: '', crewHours: '', quantityValue: '', quantityUnit: '', siteConditions: '', blocker: '', nextAction: '',
};

const simulatedLocation = { state: 'simulated' as const, latitude: 16.5062, longitude: 80.648 };

function stableUuid(): string {
  return globalThis.crypto.randomUUID();
}

function parseDraft(
  form: FormState,
  record: EmployeeProjectRecord,
  photo: File | undefined,
  location: typeof simulatedLocation | undefined,
  eventId: string,
  occurredAt: string,
): { draft?: FieldRecordDraft; error?: string } {
  const milestone = record.milestones[0];
  if (!milestone) return { error: 'No milestone is assigned to this project.' };
  if (!photo) return { error: 'Add an evidence photo.' };
  if (!location) return { error: 'Set the simulated PC location before publishing.' };
  if (!form.workDescription.trim() || !form.siteConditions.trim() || !form.nextAction.trim()) {
    return { error: 'Complete work, site conditions, and next action.' };
  }
  const claimedProgress = Number(form.claimedProgress);
  if (!Number.isFinite(claimedProgress) || claimedProgress < 0 || claimedProgress > 100) return { error: 'Enter claimed progress from 0 to 100.' };
  const crewCount = Number(form.crewCount);
  const crewHours = Number(form.crewHours);
  if (!Number.isInteger(crewCount) || crewCount < 0 || !Number.isFinite(crewHours) || crewHours < 0) return { error: 'Enter crew count and hours.' };
  const quantityValue = form.quantityValue.trim() === '' ? null : Number(form.quantityValue);
  const quantityUnit = form.quantityUnit.trim() || null;
  if ((quantityValue === null) !== (quantityUnit === null) || (quantityValue !== null && (!Number.isFinite(quantityValue) || quantityValue < 0))) {
    return { error: 'Quantity and unit must be provided together.' };
  }
  return {
    draft: {
      eventId,
      occurredAt,
      projectId: record.project.id,
      milestoneId: milestone.id,
      workDescription: form.workDescription.trim(),
      claimedProgress,
      crewCount,
      crewHours,
      quantityValue,
      quantityUnit,
      siteConditions: form.siteConditions.trim(),
      blocker: form.blocker.trim() || null,
      nextAction: form.nextAction.trim(),
      photo,
      location,
    },
  };
}

export function EmployeeWorkspace({ session, onSignOut }: { session: BrowserSession; onSignOut: () => void }) {
  const [workspace, setWorkspace] = useState<WorkspaceState>({ kind: 'loading' });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photo, setPhoto] = useState<File>();
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [location, setLocation] = useState<typeof simulatedLocation>();
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string>();
  const [attempt, setAttempt] = useState<{ eventId: string; occurredAt: string }>();
  const [message, setMessage] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async (preserveReady = false): Promise<boolean> => {
    if (!preserveReady) setWorkspace({ kind: 'loading' });
    try {
      setWorkspace({ kind: 'ready', ...await loadEmployeeWorkspace(session) });
      return true;
    } catch (error) {
      if (!preserveReady) {
        setWorkspace({ kind: 'error', message: error instanceof Error ? error.message : 'Connection unavailable — try again.' });
      }
      return false;
    }
  }, [session]);

  useEffect(() => { void refresh(); }, [refresh]);

  const resetAttempt = useCallback(() => {
    setAttempt(undefined);
    setSaved(false);
    setMessage(undefined);
  }, []);

  const currentRecord = workspace.kind === 'ready' ? workspace.record : undefined;
  const validation = useMemo(() => currentRecord && attempt
    ? parseDraft(form, currentRecord, photo, location, attempt.eventId, attempt.occurredAt)
    : undefined, [attempt, currentRecord, form, location, photo]);

  function update(field: keyof FormState, value: string) {
    if (form[field] === value) return;
    setForm((current) => ({ ...current, [field]: value }));
    resetAttempt();
  }

  async function saveSimulatedLocation() {
    if (locationSaving || location) return;
    setLocationSaving(true);
    setLocationMessage(undefined);
    try {
      await persistSimulatedFieldLocation(session);
      setLocation(simulatedLocation);
      resetAttempt();
      setLocationMessage('Field location saved to Karaa');
    } catch (error) {
      setLocationMessage(error instanceof Error ? error.message : 'Connection unavailable — try again.');
    } finally {
      setLocationSaving(false);
    }
  }

  async function publish() {
    if (!currentRecord || saving) return;
    const activeAttempt = attempt ?? { eventId: stableUuid(), occurredAt: new Date().toISOString() };
    if (!attempt) setAttempt(activeAttempt);
    const parsed = parseDraft(form, currentRecord, photo, location, activeAttempt.eventId, activeAttempt.occurredAt);
    if (!parsed.draft) {
      setSaved(false);
      setMessage(parsed.error);
      return;
    }

    setSaving(true);
    setMessage(undefined);
    setSaved(false);
    try {
      await publishEmployeeFieldRecord(session, parsed.draft);
      const refreshed = await refresh(true);
      if (!refreshed) throw new Error('Connection unavailable — try again.');
      setForm(emptyForm);
      setPhoto(undefined);
      setPhotoInputKey((current) => current + 1);
      setLocation(undefined);
      setLocationMessage(undefined);
      setAttempt(undefined);
      setSaved(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Connection unavailable — try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell session={session} onSignOut={onSignOut} eyebrow="Authorized field record" title="Employee workspace">
      {workspace.kind === 'loading' && <section className="workspace-intro" aria-live="polite"><p>Loading your authorized field record…</p></section>}
      {workspace.kind === 'error' && (
        <section className="workspace-intro" aria-live="assertive">
          <p role="alert">{workspace.message}</p>
          <button className="button button-quiet" type="button" onClick={() => void refresh()}>Retry loading record</button>
        </section>
      )}
      {workspace.kind === 'ready' && (
        <section className="employee-workspace" aria-label="Employee field record workspace">
          <section className="project-summary" aria-labelledby="assigned-project-title">
            <p className="eyebrow">Authorized project</p>
            <h2 id="assigned-project-title">{workspace.record.project.name}</h2>
            <p>{workspace.record.project.verticalName} · {workspace.record.project.progress}% current project progress</p>
          </section>

          <section className="canonical-history" aria-labelledby="canonical-history-title">
            <p className="eyebrow">Canonical progress updates</p>
            <h2 id="canonical-history-title">Recorded project evidence</h2>
            {workspace.record.updates.length === 0 ? <p>No recorded progress updates yet.</p> : (
              <ul>
                {workspace.record.updates.map((update) => <li key={update.id}><strong>{update.claimedProgress}%</strong> {update.workDescription}</li>)}
              </ul>
            )}
          </section>

          <section className="existing-messages" aria-labelledby="existing-messages-title">
            <p className="eyebrow">Existing project messages</p>
            <h2 id="existing-messages-title">Project conversation</h2>
            {!workspace.conversation ? <p>No existing project conversation is available.</p> : workspace.conversation.messages.length === 0 ? <p>No messages in this project conversation.</p> : (
              <ul>{workspace.conversation.messages.map((item) => <li key={item.id}>{item.body}</li>)}</ul>
            )}
          </section>

          <section className="field-record-form" aria-labelledby="publish-title">
            <p className="eyebrow">Evidence → Progress → Decision</p>
            <h2 id="publish-title">Publish progress update</h2>
            <p className="form-helper">The service accepts one image and one field-record payload. No project data is retained or queued in this browser.</p>
            <div className="field-grid">
              <label>Work completed<textarea aria-label="Work completed" value={form.workDescription} onChange={(event) => update('workDescription', event.target.value)} /></label>
              <label>Claimed progress (%)<input aria-label="Claimed progress (%)" inputMode="decimal" value={form.claimedProgress} onChange={(event) => update('claimedProgress', event.target.value)} /></label>
              <label>Crew count<input aria-label="Crew count" inputMode="numeric" value={form.crewCount} onChange={(event) => update('crewCount', event.target.value)} /></label>
              <label>Crew hours<input aria-label="Crew hours" inputMode="decimal" value={form.crewHours} onChange={(event) => update('crewHours', event.target.value)} /></label>
              <label>Quantity<input aria-label="Quantity" inputMode="decimal" value={form.quantityValue} onChange={(event) => update('quantityValue', event.target.value)} /></label>
              <label>Quantity unit<input aria-label="Quantity unit" value={form.quantityUnit} onChange={(event) => update('quantityUnit', event.target.value)} /></label>
              <label>Site conditions<textarea aria-label="Site conditions" value={form.siteConditions} onChange={(event) => update('siteConditions', event.target.value)} /></label>
              <label>Blocker (optional)<textarea aria-label="Blocker (optional)" value={form.blocker} onChange={(event) => update('blocker', event.target.value)} /></label>
              <label>Next action<textarea aria-label="Next action" value={form.nextAction} onChange={(event) => update('nextAction', event.target.value)} /></label>
              <label>Evidence photo<input key={photoInputKey} aria-label="Evidence photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const next = event.currentTarget.files?.[0]; if (next && next !== photo) { setPhoto(next); resetAttempt(); } }} /></label>
            </div>
            <div className="location-control">
              <p><strong>Presentation simulator — not a real location.</strong> This PC browser uses fixed demo coordinates only when you choose them.</p>
              <button className="button button-quiet" type="button" disabled={locationSaving || Boolean(location)} onClick={() => void saveSimulatedLocation()}>{locationSaving ? 'Saving simulated PC location…' : location ? 'Simulated PC location saved' : 'Use simulated PC location'}</button>
              {location && <p>Presentation simulator — not a real location</p>}
              {locationMessage ? <p className={location ? 'saved-confirmation' : 'form-error'} role={location ? 'status' : 'alert'}>{locationMessage}</p> : null}
            </div>
            {message && <p className="form-error" role="alert">{message}</p>}
            {saved && <p className="saved-confirmation" role="status">Saved to Karaa</p>}
            <button className="button button-primary" type="button" disabled={saving} onClick={() => void publish()}>
              {saving ? 'Saving update…' : message && attempt && validation?.draft ? 'Retry publishing update' : 'Publish progress update'}
            </button>
          </section>
        </section>
      )}
    </AppShell>
  );
}
