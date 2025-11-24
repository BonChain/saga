/**
 * Wallet-related type definitions for SuiSaga
 * Comprehensive TypeScript interfaces for wallet management
 */

// Sui wallet information from dApp-kit
export interface WalletInfo {
  name: string;
  icon?: string;
  extension?: string;
  url?: string;
}

// Wallet connection state
export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  currentAccount: CurrentAccount | null;
  availableWallets: WalletInfo[];
}

// Current connected wallet account
export interface CurrentAccount {
  address: string;
  publicKey: string;
}

// Wallet balance information
export interface WalletBalance {
  totalBalance: string; // Formatted SUI balance
  rawBalance: string;   // Raw MIST balance
  isLoading: boolean;
}

// Wallet transaction types
export interface WalletTransaction {
  hash: string;
  digest: string;
  kind: string;
  effects: {
    status: {
      status: string;
    };
  };
  timestamp: number;
}

// Wallet error types
export interface WalletError {
  code: 'CONNECTION_FAILED' | 'USER_REJECTED' | 'TIMEOUT' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  walletName?: string;
  originalError?: Error;
}

// Wallet modal state
export interface WalletModalState {
  isOpen: boolean;
  selectedWallet: string | null;
  isError: boolean;
  errorMessage?: string;
}

// Wallet dropdown state
export interface WalletDropdownState {
  isOpen: boolean;
  copySuccess: boolean;
  isDisconnecting: boolean;
}

// Auto-connect configuration
export interface AutoConnectConfig {
  enabled: boolean;
  preferredWallets: string[];
  timeout: number; // milliseconds
  maxRetries: number;
}

// Wallet event types
export interface WalletEvent {
  type: 'connect' | 'disconnect' | 'account_change' | 'error';
  payload: {
    wallet?: WalletInfo;
    account?: CurrentAccount;
    error?: WalletError;
  };
}

// Wallet analytics data
export interface WalletAnalytics {
  connectionAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  averageConnectionTime: number;
  walletUsage: Record<string, number>;
  lastConnectionTime: number | null;
}

// Wallet settings persistence
export interface WalletSettings {
  autoConnect: boolean;
  preferredWallet: string | null;
  rememberChoice: boolean;
  network: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  showBalance: boolean;
  notifications: {
    connection: boolean;
    disconnection: boolean;
    balanceChange: boolean;
  };
}

// Network information
export interface NetworkInfo {
  id: SuiNetwork;
  name: string;
  rpcUrl: string;
  chainId: string;
  blockExplorerUrl?: string;
  emoji?: string;
  isTestnet?: boolean;
}

// Sui network configuration
export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

export interface SuiNetworkConfig {
  name: string;
  chainId: string;
  rpcUrl: string;
  blockExplorerUrl?: string;
}

// Wallet action types
export type WalletAction =
  | { type: 'CONNECT_REQUEST'; walletName: string }
  | { type: 'CONNECT_SUCCESS'; wallet: WalletInfo; account: CurrentAccount }
  | { type: 'CONNECT_FAILURE'; error: WalletError }
  | { type: 'DISCONNECT_REQUEST' }
  | { type: 'DISCONNECT_SUCCESS' }
  | { type: 'ACCOUNT_CHANGE'; account: CurrentAccount }
  | { type: 'CLEAR_ERROR' }
  | { type: 'COPY_SUCCESS' }
  | { type: 'COPY_FAILURE' };

// Wallet reducer state
export interface WalletState extends WalletConnectionState {
  modal: WalletModalState;
  dropdown: WalletDropdownState;
  balance: WalletBalance;
  analytics: WalletAnalytics;
  settings: WalletSettings;
}

// Helper type for wallet connection props
export interface WalletConnectionProps {
  className?: string;
  externalModalOpen?: boolean;
  onExternalModalClose?: () => void;
  onWalletConnect?: (wallet: WalletInfo, account: CurrentAccount) => void;
  onWalletDisconnect?: () => void;
  onAccountChange?: (account: CurrentAccount | null) => void;
  onError?: (error: WalletError) => void;
  theme?: 'default' | 'compact' | 'minimal';
  showBalance?: boolean;
  autoConnect?: boolean;
}

// Wallet connection result
export interface WalletConnectionResult {
  success: boolean;
  wallet?: WalletInfo;
  account?: CurrentAccount;
  error?: WalletError;
}

// Transaction signing result
export interface TransactionSigningResult {
  success: boolean;
  transaction?: WalletTransaction;
  error?: WalletError;
}

// Transaction signing options
export interface TransactionSigningOptions {
  onSignSuccess?: (transaction: WalletTransaction) => void;
  onSignError?: (error: WalletError) => void;
  onSignStart?: () => void;
  timeout?: number;
}

// Validation types
export interface WalletValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Export commonly used type guards
export const isWalletError = (error: unknown): error is WalletError => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

export const isValidSuiAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
};

export const isValidSuiPublicKey = (publicKey: string): boolean => {
  return publicKey.startsWith('0x') && publicKey.length === 66;
};