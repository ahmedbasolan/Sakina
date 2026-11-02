/**
 * The JS wrapper must be safe to call from any screen on any platform: on
 * Android, in Jest, and on an iOS build without the native module, every
 * function is a no-op that returns the "unsupported" answer.
 */

type Wrapper = typeof import('../index');

function makeNative() {
  return {
    isSupported: jest.fn(() => true),
    configure: jest.fn(),
    getDeviceId: jest.fn(() => 'device-uuid'),
    peekDeviceId: jest.fn(() => 'device-uuid'),
    writeSnapshot: jest.fn(),
    startLocal: jest.fn(async () => true),
    endAll: jest.fn(async () => undefined),
    markSwitchedOff: jest.fn(),
    clearShared: jest.fn(),
  };
}

function load(os: 'ios' | 'android', native: object | null) {
  const requireOptionalNativeModule = jest.fn(() => native);
  let wrapper!: Wrapper;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: os } }));
    jest.doMock('expo-modules-core', () => ({ requireOptionalNativeModule }));
    wrapper = require('../index');
  });
  return { wrapper, requireOptionalNativeModule };
}

async function expectAllNoOps(w: Wrapper) {
  expect(w.isSupported()).toBe(false);
  expect(() => w.configure({ registerUrl: 'https://x.test/fn', anonKey: 'k' })).not.toThrow();
  expect(w.getDeviceId()).toBe('');
  expect(w.peekDeviceId()).toBe('');
  expect(() => w.writeSnapshot('{"version":1}')).not.toThrow();
  await expect(w.startLocal('Asr', 1_800_000_000)).resolves.toBe(false);
  await expect(w.endAll()).resolves.toBeUndefined();
  expect(() => w.markSwitchedOff()).not.toThrow();
  expect(() => w.clearShared()).not.toThrow();
}

afterEach(() => {
  jest.resetModules();
});

describe('sakina-live-activity JS wrapper', () => {
  it('is a no-op on Android', async () => {
    const native = makeNative();
    const { wrapper, requireOptionalNativeModule } = load('android', native);

    await expectAllNoOps(wrapper);
    // Android never even looks the module up, and nothing reaches native.
    expect(requireOptionalNativeModule).not.toHaveBeenCalled();
    for (const fn of Object.values(native)) expect(fn).not.toHaveBeenCalled();
  });

  it('returns false when the native module is missing', async () => {
    const { wrapper, requireOptionalNativeModule } = load('ios', null);

    await expectAllNoOps(wrapper);
    expect(requireOptionalNativeModule).toHaveBeenCalledWith('SakinaLiveActivity');
  });

  it('forwards every call to the native module on iOS', async () => {
    const native = makeNative();
    const { wrapper } = load('ios', native);

    expect(wrapper.isSupported()).toBe(true);
    wrapper.configure({ registerUrl: 'https://x.test/fn', anonKey: 'anon' });
    expect(native.configure).toHaveBeenCalledWith('https://x.test/fn', 'anon');
    expect(wrapper.getDeviceId()).toBe('device-uuid');
    expect(wrapper.peekDeviceId()).toBe('device-uuid');
    expect(native.peekDeviceId).toHaveBeenCalledTimes(1);
    wrapper.markSwitchedOff();
    expect(native.markSwitchedOff).toHaveBeenCalledTimes(1);
    wrapper.writeSnapshot('{"version":1}');
    expect(native.writeSnapshot).toHaveBeenCalledWith('{"version":1}');
    await expect(wrapper.startLocal('Asr', 1_800_000_000)).resolves.toBe(true);
    expect(native.startLocal).toHaveBeenCalledWith('Asr', 1_800_000_000);
    await wrapper.endAll();
    expect(native.endAll).toHaveBeenCalledTimes(1);
    wrapper.clearShared();
    expect(native.clearShared).toHaveBeenCalledTimes(1);
  });

  it('turns a native rejection into the unsupported answer', async () => {
    const native = makeNative();
    native.startLocal.mockRejectedValueOnce(new Error('ActivityKit said no'));
    native.endAll.mockRejectedValueOnce(new Error('boom'));
    const { wrapper } = load('ios', native);

    await expect(wrapper.startLocal('Asr', 1_800_000_000)).resolves.toBe(false);
    await expect(wrapper.endAll()).resolves.toBeUndefined();
  });

  it('reports unsupported when native returns a non-boolean', () => {
    const native = makeNative();
    native.isSupported.mockReturnValueOnce(undefined as unknown as boolean);
    native.getDeviceId.mockReturnValueOnce(null as unknown as string);
    native.peekDeviceId.mockReturnValueOnce(undefined as unknown as string);
    const { wrapper } = load('ios', native);

    expect(wrapper.isSupported()).toBe(false);
    expect(wrapper.getDeviceId()).toBe('');
    expect(wrapper.peekDeviceId()).toBe('');
  });
});
