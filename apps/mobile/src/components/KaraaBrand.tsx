import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

const crown = require('../../assets/brand/karaa-crown.webp');
const wordmark = require('../../assets/brand/karaa-wordmark.webp');

export type KaraaBrandVariant = 'wordmark' | 'crown' | 'lockup';

type Props = {
  variant?: KaraaBrandVariant;
  height?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  testID?: string;
};

const ratios = { crown: 512 / 458, wordmark: 1200 / 114 } as const;

/** The canonical local Karaa identity. Transparent sources work on black and ivory surfaces. */
export function KaraaBrand({
  variant = 'wordmark',
  height = variant === 'crown' ? 32 : 22,
  accessibilityLabel = 'Karaa Global',
  style,
  imageStyle,
  testID = `karaa-brand-${variant}`,
}: Props) {
  if (variant === 'lockup') {
    const crownHeight = height;
    const wordmarkHeight = Math.max(10, height * 0.43);
    return (
      <View accessibilityLabel={accessibilityLabel} accessibilityRole="image" style={[styles.lockup, { height }, style]} testID={testID}>
        <Image accessibilityElementsHidden resizeMode="contain" source={crown} style={[{ height: crownHeight, width: crownHeight * ratios.crown }, imageStyle]} />
        <Image accessibilityElementsHidden resizeMode="contain" source={wordmark} style={[{ height: wordmarkHeight, width: wordmarkHeight * ratios.wordmark }, imageStyle]} />
      </View>
    );
  }

  const ratio = ratios[variant];
  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="image" style={[{ height, width: height * ratio }, style]} testID={testID}>
      <Image accessibilityElementsHidden resizeMode="contain" source={variant === 'crown' ? crown : wordmark} style={[styles.image, imageStyle]} />
    </View>
  );
}

/** Alias for call sites that prefer the generic design-system name. */
export const Logo = KaraaBrand;

const styles = StyleSheet.create({
  image: { height: '100%', width: '100%' },
  lockup: { alignItems: 'center', flexDirection: 'row', gap: 8 },
});
