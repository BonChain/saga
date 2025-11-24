/**
 * Network management service for SuiSaga
 * Handles network switching and network configuration
 */

import { getFullnodeUrl } from '@mysten/sui/client';
import type { SuiNetwork } from '../types/wallet';

export interface NetworkInfo {
  id: SuiNetwork;
  name: string;
  displayName: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  symbol: string;
  decimals: number;
  isTestnet: boolean;
  description: string;
  color: string;
  emoji?: string;
}

/**
 * Available Sui networks with their configurations
 */
export const NETWORKS: Record<SuiNetwork, NetworkInfo> = {
  mainnet: {
    id: 'mainnet',
    name: 'mainnet',
    displayName: 'Mainnet',
    rpcUrl: getFullnodeUrl('mainnet'),
    blockExplorerUrl: 'https://suiexplorer.com',
    symbol: 'SUI',
    decimals: 9,
    isTestnet: false,
    description: 'Sui Mainnet - Production network',
    color: '#4A90E2',
    emoji: '🔥',
  },
  testnet: {
    id: 'testnet',
    name: 'testnet',
    displayName: 'Testnet',
    rpcUrl: getFullnodeUrl('testnet'),
    blockExplorerUrl: 'https://suiexplorer.com/type=0x3',
    symbol: 'SUI',
    decimals: 9,
    isTestnet: true,
    description: 'Sui Testnet - For testing and development',
    color: '#10B981',
    emoji: '🧪',
  },
  devnet: {
    id: 'devnet',
    name: 'devnet',
    displayName: 'Devnet',
    rpcUrl: getFullnodeUrl('devnet'),
    blockExplorerUrl: 'https://suiexplorer.com/type=0x4',
    symbol: 'SUI',
    decimals: 9,
    isTestnet: true,
    description: 'Sui Devnet - Development network',
    color: '#F59E0B',
    emoji: '⚙️',
  },
  localnet: {
    id: 'localnet',
    name: 'localnet',
    displayName: 'Local',
    rpcUrl: getFullnodeUrl('localnet'),
    blockExplorerUrl: 'http://localhost:3000',
    symbol: 'SUI',
    decimals: 9,
    isTestnet: true,
    description: 'Sui Localnet - Local development network',
    color: '#8B5CF6',
    emoji: '💻',
  },
} as const;

export type NetworkId = keyof typeof NETWORKS;

/**
 * Service for managing Sui network operations
 */
export class NetworkService {
  /**
   * Get network information by network ID
   */
  static getNetworkInfo(networkId: SuiNetwork): NetworkInfo | null {
    return NETWORKS[networkId] || null;
  }

  /**
   * Get all available networks
   */
  static getAllNetworks(): NetworkInfo[] {
    return Object.values(NETWORKS);
  }

  /**
   * Get networks filtered by type (testnet or mainnet)
   */
  static getNetworksByType(isTestnet: boolean): NetworkInfo[] {
    return Object.values(NETWORKS).filter(network => network.isTestnet === isTestnet);
  }

  /**
   * Get the default network from environment variables
   */
  static getDefaultNetwork(): SuiNetwork {
    const defaultNetwork = import.meta.env.VITE_SUI_NETWORK as SuiNetwork;
    return Object.keys(NETWORKS).includes(defaultNetwork) ? defaultNetwork : 'testnet';
  }

  /**
   * Validate if a network ID is valid
   */
  static isValidNetwork(networkId: string): networkId is SuiNetwork {
    return Object.keys(NETWORKS).includes(networkId);
  }

  /**
   * Get network configuration for dApp Kit
   */
  static getNetworkConfig(): Record<string, { url: string }> {
    const config: Record<string, { url: string }> = {};

    Object.entries(NETWORKS).forEach(([networkId, networkInfo]) => {
      config[networkId] = {
        url: networkInfo.rpcUrl,
      };
    });

    return config;
  }

  /**
   * Switch to a different network
   */
  static async switchNetwork(targetNetwork: SuiNetwork): Promise<boolean> {
    try {
      // Save the preferred network to localStorage
      localStorage.setItem('suisaga_preferred_network', targetNetwork);

      // Reload the app to apply network change
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      return false;
    }
  }

  /**
   * Get the currently preferred network
   */
  static getPreferredNetwork(): SuiNetwork {
    const savedNetwork = localStorage.getItem('suisaga_preferred_network') as SuiNetwork;
    if (savedNetwork && this.isValidNetwork(savedNetwork)) {
      return savedNetwork;
    }
    return this.getDefaultNetwork();
  }

  /**
   * Clear preferred network setting
   */
  static clearPreferredNetwork(): void {
    localStorage.removeItem('suisaga_wallet_auto-connect-attempted');
  }

  /**
   * Check if two networks are the same
   */
  static isSameNetwork(network1: SuiNetwork, network2: SuiNetwork): boolean {
    return network1 === network2;
  }

  /**
   * Get network emoji for display
   */
  static getNetworkEmoji(network: SuiNetwork): string {
    const networkInfo = this.getNetworkInfo(network);
    return networkInfo?.emoji || '🌐';
  }

  /**
   * Format network name for display
   */
  static formatNetworkName(networkId: SuiNetwork): string {
    const networkInfo = this.getNetworkInfo(networkId);
    return networkInfo?.displayName || networkId;
  }

  /**
   * Get block explorer URL for a transaction
   */
  static getBlockExplorerUrl(network: SuiNetwork, digest: string): string {
    const networkInfo = this.getNetworkInfo(network);
    if (networkInfo?.blockExplorerUrl) {
      return `${networkInfo.blockExplorerUrl}/tx/${digest}`;
    }
    return '';
  }

  /**
   * Check if a network is a testnet
   */
  static isTestnet(networkId: SuiNetwork): boolean {
    const networkInfo = this.getNetworkInfo(networkId);
    return networkInfo?.isTestnet ?? false;
  }

  /**
   * Get network color theme
   */
  static getNetworkColor(networkId: SuiNetwork): string {
    const networkInfo = this.getNetworkInfo(networkId);
    return networkInfo?.color || '#00ff41';
  }

  /**
   * Get network statistics for analytics
   */
  static getNetworkStats(networkId: SuiNetwork): {
    name: string;
    isTestnet: boolean;
    blockExplorerUrl: string;
    color: string;
  } {
    const networkInfo = this.getNetworkInfo(networkId);
    return {
      name: networkInfo?.name || networkId,
      isTestnet: networkInfo?.isTestnet ?? false,
      blockExplorerUrl: networkInfo?.blockExplorerUrl || '',
      color: networkInfo?.color || '#00ff41',
    };
  }

  /**
   * Validate RPC URL
   */
  static isValidRpcUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get network RPC URL
   */
  static getRpcUrl(networkId: SuiNetwork): string {
    const networkInfo = this.getNetworkInfo(networkId);
    return networkInfo?.rpcUrl || '';
  }

  /**
   * Create network configuration for wallet providers
   */
  static createWalletConfig(networkId: SuiNetwork): any {
    const networkInfo = this.getNetworkInfo(networkId);
    return {
      networkId,
      fullnodeUrl: networkInfo?.rpcUrl || '',
    };
  }

  /**
   * Handle network-specific error messages
   */
  static formatNetworkError(error: Error, networkId: SuiNetwork): string {
    const networkName = this.formatNetworkName(networkId);
    if (error.message.includes('timeout')) {
      return `Connection to ${networkName} timed out. Please check your internet connection.`;
    } else if (error.message.includes('network') || error.message.includes('cors')) {
      return `Network error on ${networkName}. Please check your connection and try again.`;
    } else {
      return `Failed to connect to ${networkName}. Please try again.`;
    }
  }

  /**
   * Switch to network and reload page
   */
  static reloadWithNetwork(networkId: SuiNetwork): void {
    localStorage.setItem('suisaga_preferred_network', networkId);
    window.location.reload();
  }

  /**
   * Export network info for external use
   */
  static exportNetworkInfo(): Record<SuiNetwork, NetworkInfo> {
    return { ...NETWORKS };
  }
}

export default NetworkService;