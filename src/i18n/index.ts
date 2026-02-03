import { en } from './en';

// Simple i18n implementation for now
// In the future, this can be expanded to support multiple languages
export const strings = en;

export const t = (key: string, params?: Record<string, string | number>): string => {
  const keys = key.split('.');
  let value: any = strings;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value];
    } else {
      return key; // Return key if not found
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  if (params) {
    return Object.entries(params).reduce((acc, [k, v]) => {
      return acc.replace(`{${k}}`, String(v));
    }, value);
  }

  return value;
};
