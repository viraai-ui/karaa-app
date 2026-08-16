import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { MotionPressable, MotionReveal } from '../src/components/Motion';

describe('shared motion primitives', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders content in reduced-motion mode without delaying usability', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const view = render(<MotionReveal testID="reveal"><Text>Ready</Text></MotionReveal>);
    await waitFor(() => expect(view.getByText('Ready')).toBeTruthy());
    expect(view.getByTestId('reveal')).toBeTruthy();
  });

  it('fires one action for one press', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const onPress = jest.fn();
    const view = render(<MotionPressable accessibilityRole="button" onPress={onPress}><Text>Continue</Text></MotionPressable>);
    await waitFor(() => expect(view.getByRole('button')).toBeTruthy());
    fireEvent.press(view.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps disabled actions inert', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const onPress = jest.fn();
    const view = render(<MotionPressable accessibilityRole="button" disabled onPress={onPress}><Text>Syncing</Text></MotionPressable>);
    await waitFor(() => expect(view.getByRole('button')).toBeTruthy());
    fireEvent.press(view.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
