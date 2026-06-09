import AsyncStorage from '@react-native-async-storage/async-storage';
import { PeakContext } from '../types';

/**
 * Local persistence for the peaks-only upgrade-ask cooldown (spec §8). Tiny
 * AsyncStorage record — no schema/migration needed. FreemiumService loads this
 * into memory at init and consults it synchronously in shouldOfferUpgrade.
 */
export interface UpgradeAskState {
  /** Epoch ms of the last upgrade ask shown (0 = never asked). */
  lastAskAt: number;
  /** The peak type of the last ask, so we never repeat it back-to-back. */
  lastContext: PeakContext | null;
}

const UPGRADE_ASK_KEY = '@upgrade_ask';

export const loadUpgradeAsk = async (): Promise<UpgradeAskState | null> => {
  try {
    const data = await AsyncStorage.getItem(UPGRADE_ASK_KEY);
    return data ? (JSON.parse(data) as UpgradeAskState) : null;
  } catch (error) {
    console.error('Error loading upgrade-ask state:', error);
    return null;
  }
};

export const saveUpgradeAsk = async (state: UpgradeAskState): Promise<void> => {
  try {
    await AsyncStorage.setItem(UPGRADE_ASK_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving upgrade-ask state:', error);
  }
};
