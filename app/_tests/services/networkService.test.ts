/**
 * NetworkService Resilience Tests
 * Validates offline recovery and persisted network state handling
 * Focuses on real-world scenarios that affect checkout reliability
 */

type ListenerEntry = {
  listener: (state: any) => void;
  unsubscribe: jest.Mock;
};

const mockListenerRegistry: ListenerEntry[] = [];

const mockAddEventListener = jest.fn((listener: (state: any) => void) => {
  const unsubscribe = jest.fn(() => {
    const index = mockListenerRegistry.findIndex((entry) => entry.listener === listener);
    if (index >= 0) {
      mockListenerRegistry.splice(index, 1);
    }
  });

  mockListenerRegistry.push({ listener, unsubscribe });
  return unsubscribe;
});

const mockFetch = jest.fn();

const mockTriggerStateChange = (state: any) => {
  mockListenerRegistry.forEach((entry) => entry.listener(state));
};

const mockResetNetInfo = () => {
  mockListenerRegistry.splice(0, mockListenerRegistry.length);
  mockAddEventListener.mockClear();
  mockFetch.mockClear();
};

const mockGetRegisteredListeners = () => [...mockListenerRegistry];

jest.mock('@react-native-community/netinfo', () => {
  const NetInfoStateType = {
    unknown: 'unknown',
    none: 'none',
    wifi: 'wifi',
    cellular: 'cellular',
    other: 'other',
    wimax: 'wimax',
    bluetooth: 'bluetooth',
    ethernet: 'ethernet',
    vpn: 'vpn',
  } as const;

  return {
    __esModule: true,
    default: {
      addEventListener: mockAddEventListener,
      fetch: mockFetch,
    },
    addEventListener: mockAddEventListener,
    fetch: mockFetch,
    NetInfoStateType,
    __trigger: mockTriggerStateChange,
    __reset: mockResetNetInfo,
    __getListeners: mockGetRegisteredListeners,
  };
});

// eslint-disable-next-line import/first
import { NetInfoStateType } from '@react-native-community/netinfo';

// Helper to await pending microtasks scheduled during initialize()
const flushAsync = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

type NetworkServiceModule = typeof import('../../_services/network/NetworkService');

describe('NetworkService', () => {
  const loadModule = (): NetworkServiceModule => require('../../_services/network/NetworkService');

  let netInfoMock: any;
  let mmkvMock: jest.Mock;
  let mmkvInstance: {
    getString: jest.Mock;
    set: jest.Mock;
    delete: jest.Mock;
    clearAll: jest.Mock;
  };

  const setMMKVReturnValue = (value: string | null) => {
    mmkvInstance.getString.mockReturnValueOnce(value);
  };

  const createState = (overrides: Record<string, unknown> = {}) => ({
    type: NetInfoStateType.unknown,
    isConnected: false,
    isInternetReachable: false,
    details: null,
    isWifiEnabled: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    netInfoMock = jest.requireMock('@react-native-community/netinfo');
    netInfoMock.__reset();

    const mmkvModule = jest.requireMock('react-native-mmkv') as { MMKV: jest.Mock };
    mmkvMock = mmkvModule.MMKV;
    mmkvMock.mockReset();

    mmkvInstance = {
      getString: jest.fn(() => null),
      set: jest.fn(),
      delete: jest.fn(),
      clearAll: jest.fn(),
    };

    mmkvMock.mockImplementation(() => mmkvInstance);
  });

  it('should flag reconnection events and persist the recovered state', async () => {
    const onlineTimestamp = 1_720_000_000_000;
    const dateSpy = jest.spyOn(Date, 'now');
    dateSpy.mockReturnValue(onlineTimestamp);

    try {
      const offlineState = createState({
        type: NetInfoStateType.none,
        isConnected: false,
        isInternetReachable: false,
      });

      netInfoMock.fetch.mockResolvedValueOnce(offlineState);

      const { networkService } = loadModule();

      networkService.initialize();
      await flushAsync();

      expect(netInfoMock.addEventListener).toHaveBeenCalledTimes(1);
      expect(networkService.isOnline()).toBe(false);

      const onlineState = createState({
        type: NetInfoStateType.wifi,
        isConnected: true,
        isInternetReachable: true,
        isWifiEnabled: true,
        details: { isConnectionExpensive: false },
      });

      netInfoMock.__trigger(onlineState);

      expect(networkService.isOnline()).toBe(true);
      expect(networkService.justCameOnline()).toBe(true);

      expect(mmkvInstance.set).toHaveBeenCalledWith(
        'network-state',
        expect.stringContaining('"wasOffline":true')
      );

      const currentState = networkService.getState();
      expect(currentState.lastConnectedAt).toBe(onlineTimestamp);
      expect(currentState.type).toBe(NetInfoStateType.wifi);

      networkService.clearOfflineFlag();
      expect(networkService.justCameOnline()).toBe(false);
    } finally {
      dateSpy.mockRestore();
    }
  });

  it('should hydrate from persisted state on startup', () => {
    const persistedState = {
      isConnected: true,
      isInternetReachable: true,
      type: NetInfoStateType.cellular,
      isWifiEnabled: false,
      wasOffline: false,
      lastConnectedAt: 1_690_000_000_000,
    };

    setMMKVReturnValue(JSON.stringify(persistedState));

    const { networkService } = loadModule();

    const state = networkService.getState();
    expect(state).toEqual(expect.objectContaining(persistedState));
    expect(networkService.isOnline()).toBe(true);
  });

  it('should keep current state when refresh fails and clean up listeners', async () => {
    const initialOffline = createState({
      type: NetInfoStateType.none,
      isConnected: false,
      isInternetReachable: false,
    });
    netInfoMock.fetch.mockResolvedValueOnce(initialOffline);

    const { networkService } = loadModule();

    networkService.initialize();
    await flushAsync();

    const listenersBefore = netInfoMock.__getListeners();
    expect(listenersBefore).toHaveLength(1);

    const subscriber = jest.fn();
    const unsubscribeListener = networkService.subscribe(subscriber);
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({ isConnected: false, isInternetReachable: false })
    );

    const onlineState = createState({
      type: NetInfoStateType.wifi,
      isConnected: true,
      isInternetReachable: true,
      isWifiEnabled: true,
      details: { isConnectionExpensive: false },
    });
    netInfoMock.__trigger(onlineState);

    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({ isConnected: true, isInternetReachable: true })
    );

    const previousState = networkService.getState();

    netInfoMock.fetch.mockRejectedValueOnce(new Error('network fetch failed'));

    const refreshedState = await networkService.refresh();

    expect(refreshedState).toEqual(previousState);
    expect(networkService.getState()).toEqual(previousState);

    const unsubscribeSpy = listenersBefore[0]?.unsubscribe;

    unsubscribeListener();

    networkService.cleanup();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    expect(netInfoMock.__getListeners()).toHaveLength(0);
  });
});
