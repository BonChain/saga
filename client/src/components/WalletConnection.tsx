/**
 * WalletConnection component for SuiSaga
 * Manual wallet connection with full state control
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useConnectWallet, useDisconnectWallet, useWallets, useCurrentAccount } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import type {
  WalletConnectionProps
} from '../types/wallet';

export function WalletConnection({
  className = '',
  externalModalOpen = false,
  onExternalModalClose
}: WalletConnectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const suiClient = useSuiClient();
  const { mutate: connectWallet } = useConnectWallet();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleConnectClick = () => {
    setIsModalOpen(true);
  };

  const handleWalletSelect = (walletName: string) => {
    const wallet = wallets.find(w => w.name === walletName);
    if (wallet) {
      setIsConnecting(true);
      setConnectionError(null);

      connectWallet({ wallet }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setIsConnecting(false);
          setConnectionError(null);
          // Clear auto-connect flag on successful manual connection
          localStorage.removeItem('wallet-auto-connect-attempted');
        },
        onError: (error) => {
          console.error('Wallet connection failed:', error);
          setIsConnecting(false);

          // Set user-friendly error messages
          if (error instanceof Error) {
            if (error.message.includes('User rejected')) {
              setConnectionError('Connection cancelled by user');
            } else if (error.message.includes('timeout')) {
              setConnectionError('Connection timeout. Please try again.');
            } else if (error.message.includes('network')) {
              setConnectionError('Network error. Check your connection.');
            } else {
              setConnectionError(`Failed to connect ${wallet.name}. Please try again.`);
            }
          } else {
            setConnectionError(`Failed to connect ${wallet.name}. Please try again.`);
          }
        }
      });
    }
  };

  const clearError = () => {
    setConnectionError(null);
  };

  const handleDisconnect = () => {
    setIsDropdownOpen(false);
    disconnectWallet();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onExternalModalClose?.();
  };

  const handleWalletButtonClick = () => {
    if (currentAccount) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      handleConnectClick();
    }
  };

  const handleCopyAddress = async () => {
    if (currentAccount?.address) {
      try {
        await navigator.clipboard.writeText(currentAccount.address);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  // Handle external modal trigger
  useEffect(() => {
    if (externalModalOpen) {
      setIsModalOpen(true);
    }
  }, [externalModalOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!currentAccount) return;

    setLoadingBalance(true);
    try {
      const balanceResult = await suiClient.getBalance({
        owner: currentAccount.address,
      });

      const totalBalance = Number(balanceResult.totalBalance) / 1_000_000_000; // Convert from MIST to SUI
      setBalance(totalBalance.toFixed(4));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance('0.0000');
    } finally {
      setLoadingBalance(false);
    }
  }, [currentAccount, suiClient]);

  // Fetch balance when account changes
  useEffect(() => {
    if (currentAccount) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [currentAccount, fetchBalance]);

  // Auto-connect wallet if enabled and no account is connected
  useEffect(() => {
    if (!currentAccount && wallets.length > 0) {
      const autoConnectEnabled = import.meta.env.VITE_AUTO_CONNECT === 'true';
      const preferredWallets = import.meta.env.VITE_PREFERRED_WALLETS?.split(',') || [];

      if (autoConnectEnabled && preferredWallets.length > 0) {
        // Try to auto-connect to the first preferred wallet that's available
        const preferredWallet = preferredWallets[0].trim();
        const availableWallet = wallets.find(w =>
          w.name.toLowerCase() === preferredWallet.toLowerCase()
        );

        if (availableWallet && !localStorage.getItem('wallet-auto-connect-attempted')) {
          console.log(`Auto-connecting to ${availableWallet.name}...`);
          localStorage.setItem('wallet-auto-connect-attempted', 'true');

          // Call connectWallet directly to avoid circular dependency
          setIsConnecting(true);
          setConnectionError(null);

          connectWallet({ wallet: availableWallet }, {
            onSuccess: () => {
              setIsConnecting(false);
              setConnectionError(null);
            },
            onError: (error) => {
              console.error('Auto-connection failed:', error);
              setIsConnecting(false);
              // Don't show error for auto-connect failures to avoid spam
            }
          });
        }
      }
    }
  }, [currentAccount, wallets, connectWallet]);

  // Reset auto-connect flag when wallets change (wallet installed/removed)
  useEffect(() => {
    if (wallets.length > 0) {
      localStorage.removeItem('wallet-auto-connect-attempted');
    }
  }, [wallets.length]);

  return (
    <div
      className={`wallet-header ${className}`}
      ref={dropdownRef}
      role="region"
      aria-label="Wallet connection"
    >
      {currentAccount ? (
        <div className="wallet-connected">
          <div className="wallet-info">
            <button
              className="wallet-button connected"
              onClick={handleWalletButtonClick}
              aria-label="Wallet menu"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-controls="wallet-dropdown"
            >
              <span aria-label={`Wallet address: ${currentAccount.address}`}>
                {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
              </span>
              <span className="dropdown-arrow" aria-hidden="true">▼</span>
            </button>
            <div className="wallet-balance" role="status" aria-live="polite">
              {loadingBalance ? (
                <span className="balance-loading">
                  <span className="loading-spinner" aria-hidden="true">⟳</span>
                  <span aria-label="Loading wallet balance">Loading...</span>
                </span>
              ) : (
                <span className="balance-amount" aria-label={`Wallet balance: ${balance} SUI`}>
                  {balance} SUI
                </span>
              )}
            </div>
          </div>

          {/* Compact Dropdown Menu */}
          {isDropdownOpen && (
            <div
              id="wallet-dropdown"
              className="wallet-dropdown"
              role="menu"
              aria-label="Wallet options"
            >
              <div className="wallet-info-display" role="none">
                <div className="wallet-balance-display" role="status" aria-live="polite">
                  {loadingBalance ? (
                    <span className="dropdown-balance-loading">
                      <span className="loading-spinner-small" aria-hidden="true">⟳</span>
                      <span aria-label="Loading wallet balance">Loading...</span>
                    </span>
                  ) : (
                    <span aria-label={`Wallet balance: ${balance || '0.0000'} SUI`}>
                      {balance ? `${balance} SUI` : '--.-- SUI'}
                    </span>
                  )}
                </div>
                <div className="wallet-address-display" role="none">
                  <span aria-label={`Full wallet address: ${currentAccount.address}`}>
                    {currentAccount.address.slice(0, 10)}...{currentAccount.address.slice(-8)}
                  </span>
                </div>
              </div>
              <div className="dropdown-actions" role="none">
                <button
                  className={`dropdown-button copy-button ${copySuccess ? 'success' : ''}`}
                  onClick={handleCopyAddress}
                  role="menuitem"
                  aria-label={copySuccess ? 'Address copied to clipboard' : 'Copy wallet address to clipboard'}
                  aria-pressed={copySuccess}
                >
                  {copySuccess ? (
                    <>
                      <span aria-hidden="true">✓</span>
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">📋</span>
                      <span>Copy Address</span>
                    </>
                  )}
                </button>
                <button
                  className="dropdown-button disconnect-button"
                  onClick={handleDisconnect}
                  role="menuitem"
                  aria-label="Disconnect wallet"
                >
                  <span aria-hidden="true">⚡</span>
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          className="wallet-button connect"
          onClick={handleConnectClick}
          aria-label="Connect wallet to play SuiSaga"
        >
          Connect Wallet
        </button>
      )}

      {/* Connection Modal */}
      {isModalOpen && (
        <div
          className="wallet-modal-overlay"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-modal-title"
          aria-describedby="wallet-modal-description"
        >
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h2 id="wallet-modal-title">Connect Wallet</h2>
              <button
                className="close-button"
                onClick={handleCloseModal}
                aria-label="Close wallet connection modal"
              >
                ×
              </button>
            </div>

            <p id="wallet-modal-description" className="sr-only">
              Select a wallet to connect to SuiSaga. If you don't have a wallet installed, please install a Sui-compatible wallet first.
            </p>

            {/* Error Display */}
            {connectionError && (
              <div
                className="wallet-error"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                <div className="error-message">
                  ⚠️ {connectionError}
                </div>
                <button
                  className="error-dismiss-button"
                  onClick={clearError}
                  aria-label="Dismiss error message"
                >
                  ×
                </button>
              </div>
            )}

            <div className="wallet-list" role="group" aria-label="Available wallets">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  className={`wallet-option ${isConnecting ? 'connecting' : ''}`}
                  onClick={() => handleWalletSelect(wallet.name)}
                  disabled={isConnecting}
                  role="option"
                  aria-selected={false}
                  aria-label={`Connect ${wallet.name} wallet`}
                  aria-describedby={`wallet-${wallet.name}-description`}
                >
                  <span className="wallet-name">{wallet.name}</span>
                  {isConnecting && (
                    <div className="connection-spinner" aria-label="Connecting to wallet">
                      <span aria-hidden="true">⟳</span>
                      <span className="sr-only">Connecting...</span>
                    </div>
                  )}
                  {wallet.icon && !isConnecting && (
                    <img
                      src={wallet.icon}
                      alt={`${wallet.name} wallet icon`}
                      className="wallet-icon"
                      aria-hidden="true"
                    />
                  )}
                  <span id={`wallet-${wallet.name}-description`} className="sr-only">
                    Choose to connect your {wallet.name} wallet to SuiSaga
                  </span>
                </button>
              ))}
            </div>

            {wallets.length === 0 && (
              <div
                className="no-wallets-message"
                role="alert"
                aria-live="polite"
              >
                <p>No Sui wallets detected</p>
                <p>Please install a Sui wallet to continue</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}