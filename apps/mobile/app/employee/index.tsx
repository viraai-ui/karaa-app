import { useCallback, useEffect, useState } from 'react';

import { RoleGate } from '../../src/RoleGate';
import { EmployeeWorkScreen } from '../../src/features/employee/EmployeeWorkScreen';
import {
  fetchEmployeeProjectConversation,
  fetchEmployeeWork,
  sendEmployeeProjectMessage,
  submitEmployeeFieldRecord,
} from '../../src/features/employee/employee-api';
import { saveEmployeeCurrentLocation } from '../../src/features/employee/location-api';
import { chooseEvidencePhoto } from '../../src/lib/media';
import { resolveDeviceLocation, resolvePresentationLocation } from '../../src/lib/location';
import { ApiError } from '../../src/lib/api';
import { loadSession } from '../../src/lib/session';

export default function EmployeeHome() {
  const [currentUserId, setCurrentUserId] = useState('');
  const withEmployeeSession = useCallback(async () => {
    const session = await loadSession();
    if (!session || session.user.role !== 'employee') {
      throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
    }
    return session;
  }, []);

  useEffect(() => {
    let mounted = true;
    void withEmployeeSession().then((session) => {
      if (mounted) setCurrentUserId(session.user.id);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, [withEmployeeSession]);

  const loadWork = useCallback(async () => fetchEmployeeWork(await withEmployeeSession()), [withEmployeeSession]);
  const loadConversation = useCallback(async (projectId: string) => (
    fetchEmployeeProjectConversation(await withEmployeeSession(), projectId)
  ), [withEmployeeSession]);
  const sendMessage = useCallback(async (conversationId: string, body: string) => {
    await sendEmployeeProjectMessage(await withEmployeeSession(), conversationId, body);
  }, [withEmployeeSession]);
  const submit = useCallback(async (record: Parameters<typeof submitEmployeeFieldRecord>[1]) => (
    submitEmployeeFieldRecord(await withEmployeeSession(), record)
  ), [withEmployeeSession]);
  const saveCurrentLocation = useCallback(async (location: Parameters<typeof saveEmployeeCurrentLocation>[1]) => (
    saveEmployeeCurrentLocation(await withEmployeeSession(), location)
  ), [withEmployeeSession]);

  return (
    <RoleGate requiredRole="employee">
      <EmployeeWorkScreen
        currentUserId={currentUserId}
        loadWork={loadWork}
        loadConversation={loadConversation}
        sendMessage={sendMessage}
        choosePhoto={chooseEvidencePhoto}
        resolveLocation={async () => resolvePresentationLocation()}
        resolveActiveLocation={resolveDeviceLocation}
        saveCurrentLocation={saveCurrentLocation}
        submit={submit}
      />
    </RoleGate>
  );
}
