import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { MMKV } from 'react-native-mmkv';
import { safeLog, safeWarn } from '../../_config/environment';

// Lazy-initialize MMKV to prevent crashes on real devices
// Native modules can't be instantiated during bundle evaluation
let _networkStorage: MMKV | null = null;
const getNetworkStorage = () => {
  if (!_networkStorage) {
    _networkStorage = new MMKV({ id: 'network-storage' });
  }
  return _networkStorage;
};

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: NetInfoStateType;
  isWifiEnabled: boolean;
  lastConnectedAt?: number;
  wasOffline: boolean;
}

type NetworkChangeListener = (state: NetworkState) => void;

class NetworkService {
  private listeners: Set<NetworkChangeListener> = new Set();
  private currentState: NetworkState;
  private unsubscribe?: () => void;

  constructor() {
    // Initialize with defaults - persisted state loaded in initialize()
    // to avoid accessing native modules during bundle evaluation
    this.currentState = this.getDefaultState();
  }

  /**
   * Initialize network monitoring
   */
  public initialize(): void {
    if (this.unsubscribe) {
      safeWarn('[NetworkService] Already initialized');
      return;
    }

    // Load persisted state now that native modules are ready
    this.currentState = this.getPersistedState();
    safeLog('[NetworkService] Initialized with state:', this.currentState);

    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      this.handleNetworkStateChange(state);
    });

    // Get initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      this.handleNetworkStateChange(state);
    });

    safeLog('[NetworkService] Network monitoring started');
  }

  /**
   * Clean up network monitoring
   */
  public cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.listeners.clear();
    safeLog('[NetworkService] Network monitoring stopped');
  }

  /**
   * Get current network state
   */
  public getState(): NetworkState {
    return { ...this.currentState };
  }

  /**
   * Check if device is currently online
   */
  public isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable;
  }

  /**
   * Check if device was offline and recently came back online
   */
  public justCameOnline(): boolean {
    return this.isOnline() && this.currentState.wasOffline;
  }

  /**
   * Mark that offline state has been handled
   */
  public clearOfflineFlag(): void {
    this.currentState = {
      ...this.currentState,
      wasOffline: false,
    };
    this.persistState();
  }

  /**
   * Subscribe to network state changes
   */
  public subscribe(listener: NetworkChangeListener): () => void {
    this.listeners.add(listener);

    // Immediately call listener with current state
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Force refresh network state
   */
  public async refresh(): Promise<NetworkState> {
    try {
      const state = await NetInfo.fetch();
      this.handleNetworkStateChange(state);
      return this.getState();
    } catch (error) {
      safeWarn('[NetworkService] Failed to refresh network state:', error);
      return this.getState();
    }
  }

  /**
   * Handle network state changes from NetInfo
   */
  private handleNetworkStateChange(netInfoState: NetInfoState): void {
    const wasOnline = this.isOnline();

    const newState: NetworkState = {
      isConnected: netInfoState.isConnected ?? false,
      isInternetReachable: netInfoState.isInternetReachable ?? false,
      type: netInfoState.type,
      isWifiEnabled: netInfoState.type === NetInfoStateType.wifi,
      lastConnectedAt:
        netInfoState.isConnected && netInfoState.isInternetReachable
          ? Date.now()
          : this.currentState.lastConnectedAt,
      wasOffline:
        !wasOnline && Boolean(netInfoState.isConnected && netInfoState.isInternetReachable),
    };

    // Only update and notify if state actually changed
    if (this.hasStateChanged(newState)) {
      this.currentState = newState;
      this.persistState();
      this.notifyListeners();

      safeLog('[NetworkService] Network state changed:', {
        isOnline: this.isOnline(),
        justCameOnline: this.justCameOnline(),
        type: newState.type,
      });
    }
  }

  /**
   * Check if network state has meaningfully changed
   */
  private hasStateChanged(newState: NetworkState): boolean {
    const current = this.currentState;
    return (
      current.isConnected !== newState.isConnected ||
      current.isInternetReachable !== newState.isInternetReachable ||
      current.type !== newState.type ||
      current.wasOffline !== newState.wasOffline
    );
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        safeWarn('[NetworkService] Listener error:', error);
      }
    });
  }

  /**
   * Persist network state to storage
   */
  private persistState(): void {
    try {
      getNetworkStorage().set('network-state', JSON.stringify(this.currentState));
    } catch (error) {
      safeWarn('[NetworkService] Failed to persist network state:', error);
    }
  }

  /**
   * Get persisted network state or defaults
   */
  private getPersistedState(): NetworkState {
    try {
      const stored = getNetworkStorage().getString('network-state');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      safeWarn('[NetworkService] Failed to load persisted network state:', error);
    }

    return this.getDefaultState();
  }

  /**
   * Get default network state
   */
  private getDefaultState(): NetworkState {
    return {
      isConnected: false,
      isInternetReachable: false,
      type: NetInfoStateType.unknown,
      isWifiEnabled: false,
      wasOffline: false,
    };
  }
}

// Singleton instance
export const networkService = new NetworkService();

// Add default export to fix router warnings
const utilityExport = {
  name: 'NetworkService',
  version: '1.0.0',
};

export default utilityExport;
