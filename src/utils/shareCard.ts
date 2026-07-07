import { ImageSourcePropType } from 'react-native';
import { BackgroundTheme } from '../types';

export interface CardTheme {
  id: string;
  colors: [string, string, ...string[]];
  label: string;
  textColor?: string;
}

export type CardBackground =
  | { kind: 'gradient'; colors: [string, string, ...string[]]; textColor: string; subTextColor: string }
  | { kind: 'photo'; imageSource: ImageSourcePropType; textColor: string; subTextColor: string };

/**
 * Resolves what the share-card preview should render as its background.
 * Premium nature-photo backgrounds only apply when `isPremium` is true — a
 * lapsed subscriber with a stale `selectedPhotoTheme` in state falls back to
 * the gradient instead of rendering a background they can no longer pick.
 */
export function resolveCardBackground(
  selectedTheme: CardTheme,
  selectedPhotoTheme: BackgroundTheme | null,
  isPremium: boolean,
): CardBackground {
  if (isPremium && selectedPhotoTheme) {
    return {
      kind: 'photo',
      imageSource: selectedPhotoTheme.imageSource,
      textColor: '#FFFFFF',
      subTextColor: 'rgba(255, 255, 255, 0.8)',
    };
  }
  return {
    kind: 'gradient',
    colors: selectedTheme.colors,
    textColor: selectedTheme.textColor || '#FFFFFF',
    subTextColor: selectedTheme.textColor ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.8)',
  };
}

export interface ShareTextContent {
  text: string;
  source: string;
  arabicText?: string;
  transliteration?: string;
}

export interface ShareTextToggles {
  showEnglish: boolean;
  showArabic: boolean;
  showTransliteration: boolean;
}

/** Builds the plain-text share payload from the toggled-on content sections. */
export function buildShareText(content: ShareTextContent, toggles: ShareTextToggles): string {
  let shareText = '';
  if (toggles.showEnglish) shareText += `"${content.text}"\n\n`;
  if (toggles.showArabic && content.arabicText) shareText += `${content.arabicText}\n`;
  if (toggles.showTransliteration && content.transliteration)
    shareText += `(${content.transliteration})\n`;
  shareText += `\n${content.source}\n\nShared via Sakina`;
  return shareText;
}
