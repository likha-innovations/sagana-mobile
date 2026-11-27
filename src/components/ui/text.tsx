import { Text as RNText, type TextProps } from 'react-native';

export function Text({ maxFontSizeMultiplier = 1.15, ...props }: TextProps) {
  return <RNText maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
}
