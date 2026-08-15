import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { EmployeeWorkScreen } from '../src/features/employee/EmployeeWorkScreen';
import { ApiError } from '../src/lib/api';

const projectDetail = {
  project: {
    id: '20000001-0000-4000-8000-000000000001',
    name: 'Amaravati Solar Commons',
    verticalName: 'Renewable Infrastructure',
    showcase: true,
    progress: 65,
  },
  milestones: [{
    id: '40000001-0000-4000-8000-000000000001',
    projectId: '20000001-0000-4000-8000-000000000001',
    name: 'Solar array installation',
    dueAt: null,
    weight: 1,
    progress: 65,
  }],
  updates: [],
  notifications: [],
};

const selectedPhoto = {
  uri: 'file:///demo/evidence.png',
  fileName: 'evidence.png',
  mimeType: 'image/png' as const,
};

const simulatedLocation = {
  state: 'simulated' as const,
  latitude: 16.5062,
  longitude: 80.648,
};

describe('EmployeeWorkScreen', () => {
  it('enables publish only when the complete field record is valid', async () => {
    const submit = jest.fn(async () => ({ replayed: false }));
    const rendered = render(
      <EmployeeWorkScreen
        loadWork={async () => projectDetail}
        choosePhoto={async () => selectedPhoto}
        resolveLocation={async () => simulatedLocation}
        submit={submit}
      />,
    );

    expect(await rendered.findByText('Amaravati Solar Commons')).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Publish progress update', disabled: true })).toBeTruthy();

    fireEvent.press(rendered.getByRole('button', { name: 'Add evidence photo' }));
    await rendered.findByText('evidence.png');
    fireEvent.press(rendered.getByRole('button', { name: 'Use presentation location simulator' }));
    await rendered.findByText('Presentation simulator — not a real location');
    fireEvent.changeText(rendered.getByLabelText('Completed work'), 'Installed and aligned the second inverter row.');
    fireEvent.changeText(rendered.getByLabelText('Claimed progress'), '71');
    fireEvent.changeText(rendered.getByLabelText('Crew count'), '4');
    fireEvent.changeText(rendered.getByLabelText('Crew hours'), '28');
    fireEvent.changeText(rendered.getByLabelText('Site conditions'), 'Dry access with clear cable routes.');
    fireEvent.changeText(rendered.getByLabelText('Next accountable action'), 'Inspect electrical connections before commissioning.');

    expect(rendered.getByRole('button', { name: 'Publish progress update', disabled: false })).toBeTruthy();

    fireEvent.changeText(rendered.getByLabelText('Quantity'), '12');
    expect(rendered.getByRole('button', { name: 'Publish progress update', disabled: true })).toBeTruthy();
    fireEvent.changeText(rendered.getByLabelText('Quantity unit'), 'panels');
    expect(rendered.getByRole('button', { name: 'Publish progress update', disabled: false })).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits the selected evidence only after a complete field record and confirms only after Karaa persists it', async () => {
    let resolveSubmission: ((value: { replayed: boolean }) => void) | undefined;
    const submit = jest.fn(() => new Promise<{ replayed: boolean }>((resolve) => {
      resolveSubmission = resolve;
    }));
    const choosePhoto = jest.fn(async () => selectedPhoto);
    const resolveLocation = jest.fn(async () => simulatedLocation);

    const rendered = render(
      <EmployeeWorkScreen
        loadWork={async () => projectDetail}
        choosePhoto={choosePhoto}
        resolveLocation={resolveLocation}
        submit={submit}
      />,
    );

    expect(await rendered.findByText('Amaravati Solar Commons')).toBeTruthy();
    expect(rendered.getByText('Solar array installation')).toBeTruthy();

    fireEvent.press(rendered.getByRole('button', { name: 'Add evidence photo' }));
    expect(await rendered.findByText('evidence.png')).toBeTruthy();
    expect(choosePhoto).toHaveBeenCalledTimes(1);

    fireEvent.press(rendered.getByRole('button', { name: 'Use presentation location simulator' }));
    expect(await rendered.findByText('Presentation simulator — not a real location')).toBeTruthy();
    expect(resolveLocation).toHaveBeenCalledTimes(1);

    fireEvent.changeText(rendered.getByLabelText('Completed work'), 'Installed and aligned the second inverter row.');
    fireEvent.changeText(rendered.getByLabelText('Claimed progress'), '71');
    fireEvent.changeText(rendered.getByLabelText('Crew count'), '4');
    fireEvent.changeText(rendered.getByLabelText('Crew hours'), '28');
    fireEvent.changeText(rendered.getByLabelText('Site conditions'), 'Dry access with clear cable routes.');
    fireEvent.changeText(rendered.getByLabelText('Next accountable action'), 'Inspect electrical connections before commissioning.');

    fireEvent.press(rendered.getByRole('button', { name: 'Publish progress update' }));

    expect(await rendered.findByText('Saving update…')).toBeTruthy();
    expect(rendered.queryByText('Saved to Karaa')).toBeNull();
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      photo: selectedPhoto,
      location: simulatedLocation,
      claimedProgress: 71,
      crewCount: 4,
      crewHours: 28,
      workDescription: 'Installed and aligned the second inverter row.',
    }));

    await act(async () => {
      resolveSubmission?.({ replayed: false });
    });

    expect(await rendered.findByText('Saved to Karaa')).toBeTruthy();
    expect(rendered.queryByText('evidence.png')).toBeNull();
    expect(rendered.getByText('Location not set')).toBeTruthy();
    expect(rendered.getByLabelText('Completed work').props.value).toBe('');
    expect(rendered.getByRole('button', { name: 'Publish progress update', disabled: true })).toBeTruthy();
  });

  it('shows a submitted update only after the canonical assigned-work refresh following persistence', async () => {
    const canonicalUpdate = {
      id: '70000001-0000-4000-8000-000000000001',
      eventId: '50000002-0000-4000-8000-000000000002',
      projectId: projectDetail.project.id,
      milestoneId: projectDetail.milestones[0].id,
      authorId: '30000002-0000-4000-8000-000000000002',
      occurredAt: '2026-08-11T12:00:00.000Z',
      serverTimestamp: '2026-08-11T12:00:05.000Z',
      latitude: 16.5062,
      longitude: 80.648,
      locationState: 'simulated' as const,
      claimedProgress: 71,
      workDescription: 'Canonical inverter evidence now recorded.',
      nextAction: 'Inspect electrical connections before commissioning.',
      crewCount: 4,
      crewHours: 28,
      quantityValue: null,
      quantityUnit: null,
      siteConditions: 'Dry access with clear cable routes.',
      blocker: null,
      media: [{
        id: '60000001-0000-4000-8000-000000000001',
        mediaPath: '/v1/media/60000001-0000-4000-8000-000000000001',
        mimeType: 'image/png' as const,
        sizeBytes: 128,
      }],
    };
    const loadWork = jest.fn()
      .mockResolvedValueOnce(projectDetail)
      .mockResolvedValueOnce({ ...projectDetail, updates: [canonicalUpdate] });
    const rendered = render(
      <EmployeeWorkScreen
        loadWork={loadWork}
        choosePhoto={async () => selectedPhoto}
        resolveLocation={async () => simulatedLocation}
        submit={async () => ({ replayed: false })}
      />,
    );

    await rendered.findByText('Amaravati Solar Commons');
    expect(rendered.queryByText('Canonical inverter evidence now recorded.')).toBeNull();
    fireEvent.press(rendered.getByRole('button', { name: 'Add evidence photo' }));
    await rendered.findByText('evidence.png');
    fireEvent.press(rendered.getByRole('button', { name: 'Use presentation location simulator' }));
    await rendered.findByText('Presentation simulator — not a real location');
    fireEvent.changeText(rendered.getByLabelText('Completed work'), 'Installed and aligned the second inverter row.');
    fireEvent.changeText(rendered.getByLabelText('Claimed progress'), '71');
    fireEvent.changeText(rendered.getByLabelText('Crew count'), '4');
    fireEvent.changeText(rendered.getByLabelText('Crew hours'), '28');
    fireEvent.changeText(rendered.getByLabelText('Site conditions'), 'Dry access with clear cable routes.');
    fireEvent.changeText(rendered.getByLabelText('Next accountable action'), 'Inspect electrical connections before commissioning.');
    fireEvent.press(rendered.getByRole('button', { name: 'Publish progress update' }));

    expect(await rendered.findByText('Canonical inverter evidence now recorded.')).toBeTruthy();
    expect(loadWork).toHaveBeenCalledTimes(2);
  });

  it('accepts a denied location without inventing coordinates and keeps publish unavailable until the record is complete', async () => {
    const submit = jest.fn(async () => ({ replayed: false }));
    const rendered = render(
      <EmployeeWorkScreen
        loadWork={async () => projectDetail}
        choosePhoto={async () => selectedPhoto}
        resolveLocation={async () => ({ state: 'denied' })}
        submit={submit}
      />,
    );

    await rendered.findByText('Amaravati Solar Commons');
    expect(rendered.getByRole('button', { name: 'Publish progress update' }).props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(rendered.getByRole('button', { name: 'Add evidence photo' }));
    await rendered.findByText('evidence.png');
    fireEvent.press(rendered.getByRole('button', { name: 'Use presentation location simulator' }));
    expect(await rendered.findByText('Location permission denied')).toBeTruthy();
    fireEvent.changeText(rendered.getByLabelText('Completed work'), 'Installed and aligned the second inverter row.');
    fireEvent.changeText(rendered.getByLabelText('Claimed progress'), '71');
    fireEvent.changeText(rendered.getByLabelText('Crew count'), '4');
    fireEvent.changeText(rendered.getByLabelText('Crew hours'), '28');
    fireEvent.changeText(rendered.getByLabelText('Site conditions'), 'Dry access with clear cable routes.');
    fireEvent.changeText(rendered.getByLabelText('Next accountable action'), 'Inspect electrical connections before commissioning.');

    fireEvent.press(rendered.getByRole('button', { name: 'Publish progress update' }));

    expect(await rendered.findByText('Saved to Karaa')).toBeTruthy();
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ location: { state: 'denied' } }));
  });

  it('preserves a safe server rejection instead of misreporting it as a connection failure', async () => {
    const rendered = render(
      <EmployeeWorkScreen
        loadWork={async () => projectDetail}
        choosePhoto={async () => selectedPhoto}
        resolveLocation={async () => simulatedLocation}
        submit={async () => { throw new ApiError('REQUEST_FAILED', 'You are not assigned to this project.'); }}
      />,
    );

    await rendered.findByText('Amaravati Solar Commons');
    fireEvent.press(rendered.getByRole('button', { name: 'Add evidence photo' }));
    await rendered.findByText('evidence.png');
    fireEvent.press(rendered.getByRole('button', { name: 'Use presentation location simulator' }));
    await rendered.findByText('Presentation simulator — not a real location');
    fireEvent.changeText(rendered.getByLabelText('Completed work'), 'Installed and aligned the second inverter row.');
    fireEvent.changeText(rendered.getByLabelText('Claimed progress'), '71');
    fireEvent.changeText(rendered.getByLabelText('Crew count'), '4');
    fireEvent.changeText(rendered.getByLabelText('Crew hours'), '28');
    fireEvent.changeText(rendered.getByLabelText('Site conditions'), 'Dry access with clear cable routes.');
    fireEvent.changeText(rendered.getByLabelText('Next accountable action'), 'Inspect electrical connections before commissioning.');

    fireEvent.press(rendered.getByRole('button', { name: 'Publish progress update' }));

    expect(await rendered.findByText('You are not assigned to this project.')).toBeTruthy();
    expect(rendered.queryByText('Connection unavailable — try again.')).toBeNull();
    expect(rendered.queryByText('Saved to Karaa')).toBeNull();
  });

  it('reuses an unchanged field-record attempt after a connection failure', async () => {
    const submit = jest.fn()
      .mockRejectedValueOnce(new ApiError('OFFLINE', 'Connection unavailable — try again.'))
      .mockResolvedValueOnce({ replayed: true });
    const rendered = render(
      <EmployeeWorkScreen
        loadWork={async () => projectDetail}
        choosePhoto={async () => selectedPhoto}
        resolveLocation={async () => simulatedLocation}
        createEventId={() => '50000002-0000-4000-8000-000000000002'}
        submit={submit}
      />,
    );

    await rendered.findByText('Amaravati Solar Commons');
    fireEvent.press(rendered.getByRole('button', { name: 'Add evidence photo' }));
    await rendered.findByText('evidence.png');
    fireEvent.press(rendered.getByRole('button', { name: 'Use presentation location simulator' }));
    await rendered.findByText('Presentation simulator — not a real location');
    fireEvent.changeText(rendered.getByLabelText('Completed work'), 'Installed and aligned the second inverter row.');
    fireEvent.changeText(rendered.getByLabelText('Claimed progress'), '71');
    fireEvent.changeText(rendered.getByLabelText('Crew count'), '4');
    fireEvent.changeText(rendered.getByLabelText('Crew hours'), '28');
    fireEvent.changeText(rendered.getByLabelText('Site conditions'), 'Dry access with clear cable routes.');
    fireEvent.changeText(rendered.getByLabelText('Next accountable action'), 'Inspect electrical connections before commissioning.');

    fireEvent.press(rendered.getByRole('button', { name: 'Publish progress update' }));
    expect(await rendered.findByText('Connection unavailable — try again.')).toBeTruthy();
    fireEvent.press(rendered.getByRole('button', { name: 'Publish progress update' }));
    expect(await rendered.findByText('Saved to Karaa')).toBeTruthy();

    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit.mock.calls[0][0]).toMatchObject({ eventId: expect.any(String), occurredAt: expect.any(String) });
    expect(submit.mock.calls[1][0]).toMatchObject({
      eventId: submit.mock.calls[0][0].eventId,
      occurredAt: submit.mock.calls[0][0].occurredAt,
    });
  });

  it('saves an explicitly simulated current field location only after Karaa accepts it', async () => {
    let resolveSave: (() => void) | undefined;
    const saveCurrentLocation = jest.fn(() => new Promise<void>((resolve) => {
      resolveSave = resolve;
    }));
    const rendered = render(
      <EmployeeWorkScreen
        loadWork={async () => projectDetail}
        choosePhoto={async () => selectedPhoto}
        resolveLocation={async () => simulatedLocation}
        saveCurrentLocation={saveCurrentLocation}
        submit={async () => ({ replayed: false })}
      />,
    );

    await rendered.findByText('Amaravati Solar Commons');
    await act(async () => {
      fireEvent.press(rendered.getByRole('button', { name: 'Share presentation field location' }));
    });

    await waitFor(() => expect(saveCurrentLocation).toHaveBeenCalledWith(simulatedLocation));
    expect(rendered.queryByText('Field location saved to Karaa')).toBeNull();
    await act(async () => { resolveSave?.(); });

    expect(await rendered.findByText('Field location saved to Karaa')).toBeTruthy();
    expect(rendered.getByText('Presentation simulator — not a real location')).toBeTruthy();
  });

  it('rotates the field-record attempt when evidence changes after a connection failure', async () => {
    const replacementPhoto = { ...selectedPhoto, uri: 'file:///demo/replacement.png', fileName: 'replacement.png' };
    const choosePhoto = jest.fn()
      .mockResolvedValueOnce(selectedPhoto)
      .mockResolvedValueOnce(replacementPhoto);
    const submit = jest.fn()
      .mockRejectedValueOnce(new ApiError('OFFLINE', 'Connection unavailable — try again.'))
      .mockResolvedValueOnce({ replayed: false });
    const createEventId = jest.fn()
      .mockReturnValueOnce('50000002-0000-4000-8000-000000000002')
      .mockReturnValueOnce('50000003-0000-4000-8000-000000000003');
    const rendered = render(
      <EmployeeWorkScreen
        loadWork={async () => projectDetail}
        choosePhoto={choosePhoto}
        resolveLocation={async () => simulatedLocation}
        createEventId={createEventId}
        submit={submit}
      />,
    );

    await rendered.findByText('Amaravati Solar Commons');
    fireEvent.press(rendered.getByRole('button', { name: 'Add evidence photo' }));
    await rendered.findByText('evidence.png');
    fireEvent.press(rendered.getByRole('button', { name: 'Use presentation location simulator' }));
    await rendered.findByText('Presentation simulator — not a real location');
    fireEvent.changeText(rendered.getByLabelText('Completed work'), 'Installed and aligned the second inverter row.');
    fireEvent.changeText(rendered.getByLabelText('Claimed progress'), '71');
    fireEvent.changeText(rendered.getByLabelText('Crew count'), '4');
    fireEvent.changeText(rendered.getByLabelText('Crew hours'), '28');
    fireEvent.changeText(rendered.getByLabelText('Site conditions'), 'Dry access with clear cable routes.');
    fireEvent.changeText(rendered.getByLabelText('Next accountable action'), 'Inspect electrical connections before commissioning.');

    fireEvent.press(rendered.getByRole('button', { name: 'Publish progress update' }));
    expect(await rendered.findByText('Connection unavailable — try again.')).toBeTruthy();
    fireEvent.press(rendered.getByRole('button', { name: 'Add evidence photo' }));
    expect(await rendered.findByText('replacement.png')).toBeTruthy();
    fireEvent.press(rendered.getByRole('button', { name: 'Publish progress update' }));
    expect(await rendered.findByText('Saved to Karaa')).toBeTruthy();

    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit.mock.calls[1][0]).toMatchObject({ photo: replacementPhoto });
    expect(submit.mock.calls[1][0].eventId).not.toBe(submit.mock.calls[0][0].eventId);
  });
});
