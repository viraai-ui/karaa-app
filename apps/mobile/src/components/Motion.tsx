import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  type ImageProps,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const FAST = 140;
const ENTER = 240;

// One platform query/listener is shared by every primitive. This avoids adding a native
// listener for every pressable in long feeds. Unknown is treated as reduced motion so
// content is never initially hidden while the preference is being resolved.
let reduceMotion: boolean | undefined;
let reduceMotionQuery: Promise<boolean> | undefined;
let reduceMotionSubscription: { remove: () => void } | undefined;
const reduceMotionListeners = new Set<(value: boolean) => void>();

function publishReduceMotion(value: boolean) {
  reduceMotion = value;
  reduceMotionListeners.forEach((listener) => listener(value));
}

function subscribeReduceMotion(listener: (value: boolean) => void) {
  reduceMotionListeners.add(listener);
  if (!reduceMotionQuery) {
    reduceMotionQuery = AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => { publishReduceMotion(value); return value; })
      .catch(() => { publishReduceMotion(false); return false; });
  }
  if (!reduceMotionSubscription) {
    reduceMotionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', publishReduceMotion);
  }
  return () => { reduceMotionListeners.delete(listener); };
}

/** Tracks the platform setting and renders the final state while it is unknown/reduced. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(reduceMotion ?? true);
  useEffect(() => {
    // Jest has no platform preference to observe; staying in the already-visible final
    // state also keeps asynchronous native mock updates out of unrelated route tests.
    if (process.env.NODE_ENV === 'test') return;
    return subscribeReduceMotion(setReduced);
  }, []);
  return reduced;
}

export function MotionReveal({ children, delay = 0, style, testID }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle>; testID?: string }) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(1)).current;
  const hasEntered = useRef(false);
  useEffect(() => {
    if (reduced || hasEntered.current) { value.setValue(1); return; }
    hasEntered.current = true;
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: ENTER, delay: Math.min(delay, 180), easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [delay, reduced, value]);
  return <Animated.View testID={testID} style={[style, { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>{children}</Animated.View>;
}

/** Tactile feedback without changing the semantic hit target or delaying onPress. */
export function MotionPressable({ children, style, disabled, onPressIn, onPressOut, onFocus, onBlur, wrapperStyle, suppressFocusRing = false, ...props }: PressableProps & { wrapperStyle?: StyleProp<ViewStyle>; suppressFocusRing?: boolean }) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [focused, setFocused] = useState(false);
  const animate = (toValue: number) => {
    scale.stopAnimation();
    if (reduced) { scale.setValue(1); return; }
    Animated.timing(scale, { toValue, duration: FAST, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={[wrapperStyle, { transform: [{ scale }] }]}>
      <Pressable
        {...props}
        disabled={disabled}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onPressIn={(event) => { animate(0.985); onPressIn?.(event); }}
        onPressOut={(event) => { animate(1); onPressOut?.(event); }}
        style={({ pressed }) => [
          typeof style === 'function' ? style({ pressed }) : style,
          pressed && !disabled ? styles.pressed : undefined,
          focused && !disabled && !suppressFocusRing ? styles.focused : undefined,
          disabled ? styles.disabled : undefined,
        ]}
      >{children}</Pressable>
    </Animated.View>
  );
}

export function MotionImage({ style, onLoad, ...props }: ImageProps) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const hasLoaded = useRef(false);
  return <Animated.Image {...props} onLoad={(event) => {
    if (!hasLoaded.current && !reduced) {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
    hasLoaded.current = true;
    onLoad?.(event);
  }} style={[style, { opacity }]} />;
}

export function MotionProgressFill({ progress, style }: { progress: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(1)).current;
  const hasEntered = useRef(false);
  const normalized = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  useEffect(() => {
    if (reduced || hasEntered.current) { value.setValue(1); return; }
    hasEntered.current = true;
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [reduced, value]);
  return <Animated.View style={[styles.progressAnchor, { width: `${normalized}%` }]}><Animated.View style={[StyleSheet.absoluteFill, style, { transform: [{ scaleX: value }] }]} /></Animated.View>;
}

/** Native-driver-safe backdrop + sheet entrance for transient modal surfaces. */
export function MotionModalEntrance({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) { value.setValue(1); return; }
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: ENTER, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [reduced, value]);
  return <Animated.View style={[style, { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.94 },
  focused: { outlineColor: '#B58A3A', outlineStyle: 'solid', outlineWidth: 2 } as ViewStyle,
  disabled: { opacity: 0.5 },
  progressAnchor: { height: '100%', overflow: 'hidden', transformOrigin: 'left center' } as ViewStyle,
});
