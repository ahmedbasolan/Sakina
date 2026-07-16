export interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Request timeout, too many requests, server errors
  // ECONNABORTED covers axios's own client-side `timeout` option — without it,
  // a request that times out fails the retry-eligibility check and throws
  // immediately after one attempt instead of backing off and retrying.
  // ERR_NETWORK is axios ^1.x's actual `error.code` for a plain connectivity
  // failure (wifi blip, airplane mode, DNS hiccup) — the single most common
  // real-world failure mode. 'NETWORK_ERROR' never matched it (axios never
  // sets that string), so every such failure was silently misclassified as
  // non-retryable and failed after one attempt instead of backing off.
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ECONNREFUSED', 'ENOTFOUND', 'ERR_NETWORK', 'NETWORK_ERROR'],
};

/**
 * Determines if an error is retryable based on status code or error message
 */
const isRetryableError = (error: any, config: RetryConfig): boolean => {
  // Check status code
  const statusCode = error?.response?.status || error?.status;
  if (statusCode && config.retryableStatusCodes.includes(statusCode)) {
    return true;
  }

  // Check error code/message
  const errorCode = error?.code || error?.message || '';
  return config.retryableErrors.some((retryable) =>
    errorCode.toString().toUpperCase().includes(retryable),
  );
};

/**
 * Calculates delay with exponential backoff and jitter
 */
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const exponentialDelay = config.retryDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  // Add jitter (±25%) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, cappedDelay + jitter);
};

/**
 * Sleep utility for async delay
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps an async function with retry logic
 *
 * @param operation The async operation to retry
 * @param operationName Name for logging (e.g., 'fetchPrayerTimes')
 * @param config Optional retry configuration
 * @returns Result of the operation
 * @throws Last error encountered after all retries exhausted
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      const result = await operation();

      // Log success after retry
      if (attempt > 1) {
        console.log(`[${operationName}] Succeeded on attempt ${attempt}/${fullConfig.maxRetries}`);
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error, fullConfig)) {
        console.log(`[${operationName}] Non-retryable error, failing immediately:`, error?.message || error);
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === fullConfig.maxRetries) {
        console.error(`[${operationName}] Failed after ${fullConfig.maxRetries} attempts`);
        throw error;
      }

      // Calculate and apply delay
      const delay = calculateDelay(attempt, fullConfig);
      console.log(
        `[${operationName}] Attempt ${attempt}/${fullConfig.maxRetries} failed, ` +
          `retrying in ${Math.round(delay)}ms...`,
        error?.message || error,
      );

      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Convenience function for network operations with standard retry config
 */
async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
): Promise<T> {
  return withRetry(operation, operationName, DEFAULT_RETRY_CONFIG);
}

/**
 * Axios-specific retry config with more aggressive retry settings
 */
export const AXIOS_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 3,
  retryDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 8000,
};

/**
 * Supabase-specific retry config (slightly more conservative)
 */
const SUPABASE_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 3,
  retryDelayMs: 500,
  backoffMultiplier: 2,
  maxDelayMs: 5000,
};
