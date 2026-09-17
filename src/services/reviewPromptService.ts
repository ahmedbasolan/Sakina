import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import {
  REVIEW_ASK_COOLDOWN_MS,
  REVIEW_ASK_MAX_LIFETIME,
  REVIEW_ASK_MIN_COMPLETED_DAYS,
  STORAGE_KEYS,
} from '../constants';
import { logServiceError } from './errorLoggingService';

/**
 * Local persistence for the store-review ask. Tiny AsyncStorage record, same
 * shape of thing as upgradeAskStore — no schema or migration needed.
 */
interface ReviewAskState {
  /** Epoch ms of the last prompt we asked for (0 = never). */
  lastAskAt: number;
  /** How many times this install has asked, capped at REVIEW_ASK_MAX_LIFETIME. */
  askCount: number;
}

const NEVER_ASKED: ReviewAskState = { lastAskAt: 0, askCount: 0 };

const loadState = async (): Promise<ReviewAskState> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.reviewAsk);
    return raw ? (JSON.parse(raw) as ReviewAskState) : NEVER_ASKED;
  } catch (error) {
    console.error('Error loading review-ask state:', error);
    return NEVER_ASKED;
  }
};

/**
 * Ask for a store rating after a journey day is banked.
 *
 * The OS owns whether a prompt actually appears, and it will not tell us which
 * way it went — `requestReview()` resolves identically whether iOS presented
 * the sheet or threw it away for exceeding the yearly quota. Every gate here
 * therefore exists to avoid *spending* an invisible allowance on a weak
 * moment.
 *
 * Never throws, so a storage or StoreKit failure cannot block the completion
 * flow the user has already earned.
 */
export const maybeAskForReview = async (completedDayCount: number): Promise<void> => {
  try {
    if (completedDayCount < REVIEW_ASK_MIN_COMPLETED_DAYS) return;

    const state = await loadState();
    if (state.askCount >= REVIEW_ASK_MAX_LIFETIME) return;
    if (Date.now() - state.lastAskAt < REVIEW_ASK_COOLDOWN_MS) return;

    // False on TestFlight, on Android below 5.0 with no store URL configured,
    // and on web. Checking first keeps those builds from recording an ask that
    // never happened.
    if (!(await StoreReview.hasAction())) return;

    await StoreReview.requestReview();

    // Recorded on the attempt rather than on a confirmed prompt, because no
    // such confirmation exists. Treating an unknown outcome as failure would
    // re-ask on every subsequent day.
    const next: ReviewAskState = { lastAskAt: Date.now(), askCount: state.askCount + 1 };
    await AsyncStorage.setItem(STORAGE_KEYS.reviewAsk, JSON.stringify(next));
  } catch (error) {
    logServiceError(
      'ReviewPromptService',
      'maybeAskForReview',
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};
