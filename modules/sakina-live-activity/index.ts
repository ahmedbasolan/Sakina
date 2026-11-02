/**
 * JS bridge to the prayer Live Activity (iOS 17.2+, iPhone only).
 *
 * Every function is safe to call anywhere: on Android, in Jest, and on an iOS
 * build that does not contain the native module it is a no-op returning the
 * "unsupported" answer (`false`, `''`, nothing). Callers never need a
 * platform check of their own.
 *
 * The native side (ios/) also forwards push tokens to the register endpoint
 * by itself, including when iOS launches the app in the background — JS is
 * not involved in that path, which is why `configure` hands it the URL + key.
 */
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

interface SakinaLiveActivityNative {
  isSupported(): boolean;
  configure(registerUrl: string, anonKey: string): void;
  getDeviceId(): string;
  peekDeviceId(): string;
  writeSnapshot(json: string): void;
  startLocal(prayerName: string, prayerEpoch: number): Promise<boolean>;
  endAll(): Promise<void>;
  markSwitchedOff(): void;
  clearShared(): void;
}

const native: SakinaLiveActivityNative | null =
  Platform.OS === 'ios'
    ? requireOptionalNativeModule<SakinaLiveActivityNative>('SakinaLiveActivity')
    : null;

/** iOS ≥ 17.2, an iPhone, and Live Activities allowed in Settings. */
export function isSupported(): boolean {
  return native ? native.isSupported() === true : false;
}

/**
 * Stores the register endpoint and anon key in the App Group so the native
 * token forwarder can reach the server without JS.
 */
export function configure(o: { registerUrl: string; anonKey: string }): void {
  native?.configure(o.registerUrl, o.anonKey);
}

/**
 * A UUID persisted in the App Group; created on first call. `''` when unsupported.
 * Only for registering: calling it means "this device is opting in", so it also
 * lifts a `markSwitchedOff`.
 */
export function getDeviceId(): string {
  const id = native?.getDeviceId();
  return typeof id === 'string' ? id : '';
}

/**
 * The stored device id, or `''` when there is none (or the module is absent).
 * Never creates one — for teardown, which must unregister an existing id but
 * never mint an id for a user who never opted in.
 */
export function peekDeviceId(): string {
  const id = native?.peekDeviceId();
  return typeof id === 'string' ? id : '';
}

/** Writes the `VerseSnapshot` JSON (see src/services/liveActivity/verseSnapshot.ts). */
export function writeSnapshot(json: string): void {
  native?.writeSnapshot(json);
}

/**
 * Starts a card from the app (no alert). Resolves `false` if a card is already
 * live, Live Activities are off, or anything native fails.
 */
export async function startLocal(prayerName: string, prayerEpoch: number): Promise<boolean> {
  if (!native) return false;
  try {
    return (await native.startLocal(prayerName, prayerEpoch)) === true;
  } catch {
    return false;
  }
}

/** Ends every Sakina Live Activity immediately. */
export async function endAll(): Promise<void> {
  if (!native) return;
  try {
    await native.endAll();
  } catch {
    // Best effort: a card that refuses to end is dismissed by iOS at its cap.
  }
}

/**
 * Switched off, but the server could not be told yet: removes the verse
 * snapshot, KEEPS the device id (a server row may still exist under it and must
 * be unregistered later), and marks the device switched off so the native side
 * posts no tokens and ends any card that arrives. `clearShared` or
 * `getDeviceId` lift the mark.
 */
export function markSwitchedOff(): void {
  native?.markSwitchedOff();
}

/** Removes the verse snapshot, the device id and the switched-off mark from the App Group. */
export function clearShared(): void {
  native?.clearShared();
}
