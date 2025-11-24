/**
 * SuiProviders component for SuiSaga
 * Standard Sui dApp Kit setup following official documentation
 */

import React from 'react';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NetworkService } from '../services/networkService';
import type { NetworkInfo, SuiNetwork } from '../types/wallet';

// Note: @mysten/dapp-kit automatically detects installed wallets
// Phantom wallet support is included when users have the Phantom extension installed
// with Sui network support enabled

// Create network configuration using NetworkService
const { networkConfig } = createNetworkConfig(
  NetworkService.getNetworkConfig()
);

// Create a query client for React Query
const queryClient = new QueryClient();

interface SuiProvidersProps {
  children: React.ReactNode;
  defaultNetwork?: SuiNetwork;
  onNetworkChange?: (network: NetworkInfo) => void;
}

/**
 * Standard provider component that wraps the app with Sui dApp Kit providers
 * Following official Sui dApp Kit documentation patterns
 */
export function SuiProviders({
  children,
  defaultNetwork,
  onNetworkChange: _onNetworkChange
}: SuiProvidersProps) {
  const [currentNetwork, setCurrentNetwork] = React.useState<SuiNetwork>(
    defaultNetwork || NetworkService.getDefaultNetwork()
  );

  // Update current network from preferences or env
  React.useEffect(() => {
    const preferredNetwork = NetworkService.getPreferredNetwork();
    if (preferredNetwork && preferredNetwork !== currentNetwork) {
      setCurrentNetwork(preferredNetwork);
    }
  }, [currentNetwork]);

  // Check if auto-connect is enabled
  const autoConnectEnabled = import.meta.env.VITE_AUTO_CONNECT === 'true';

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={currentNetwork}>
        <WalletProvider autoConnect={autoConnectEnabled}>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}


