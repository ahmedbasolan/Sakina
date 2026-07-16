import { withRetry, AXIOS_RETRY_CONFIG } from '../retryUtils';

describe('withRetry — error classification', () => {
  it('retries an axios ERR_NETWORK failure instead of failing immediately', async () => {
    const networkError = { code: 'ERR_NETWORK', message: 'Network Error' };
    const operation = jest
      .fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce('ok');

    const result = await withRetry(operation, 'test-op', {
      ...AXIOS_RETRY_CONFIG,
      retryDelayMs: 1,
      maxDelayMs: 1,
    });

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('still fails immediately for a genuinely non-retryable error', async () => {
    const notFoundError = { response: { status: 404 }, message: 'Not Found' };
    const operation = jest.fn().mockRejectedValue(notFoundError);

    await expect(
      withRetry(operation, 'test-op', { ...AXIOS_RETRY_CONFIG, retryDelayMs: 1, maxDelayMs: 1 }),
    ).rejects.toEqual(notFoundError);

    expect(operation).toHaveBeenCalledTimes(1);
  });
});
