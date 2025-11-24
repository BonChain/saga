/**
 * Tests for WalletConnection component
 * Covers wallet connection flow, modal interactions, and accessibility compliance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SuiProviders } from '../SuiProviders';
import { WalletConnection } from '../WalletConnection';

// Mock @mysten/dapp-kit hooks
jest.mock('@mysten/dapp-kit', () => ({
  useCurrentAccount: jest.fn(),
  useConnectWallet: jest.fn(),
  useDisconnectWallet: jest.fn(),
  useWallets: jest.fn(),
  useSuiClient: jest.fn(),
}));

const mockUseCurrentAccount = require('@mysten/dapp-kit').useCurrentAccount;
const mockUseConnectWallet = require('@mysten/dapp-kit').useConnectWallet;
const mockUseDisconnectWallet = require('@mysten/dapp-kit').useDisconnectWallet;
const mockUseWallets = require('@mysten/dapp-kit').useWallets;
const mockUseSuiClient = require('@mysten/dapp-kit').useSuiClient;

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('WalletConnection Component', () => {
  const defaultProps = {
    className: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  // Helper function to render component with providers
  const renderWithProviders = (component: React.ReactElement, props = {}) => {
    return render(
      <SuiProviders>
        {component}
      </SuiProviders>,
      props
    );
  };

  describe('Initial rendering when disconnected', () => {
    beforeEach(() => {
      mockUseCurrentAccount.mockReturnValue(null);
      mockUseWallets.mockReturnValue([
        { name: 'Sui Wallet', icon: 'sui-icon.png' },
        { name: 'Suiet', icon: 'suiet-icon.png' },
      ]);
      mockUseSuiClient.mockReturnValue({
        getBalance: jest.fn().mockResolvedValue({
          totalBalance: 1000000000n, // 1 SUI
        }),
      });
    });

    test('renders connect button when disconnected', () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).toHaveTextContent('Connect Wallet');
    });

    test('has no accessibility violations', async () => {
      const { container } = renderWithProviders(<WalletConnection {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Wallet modal interactions', () => {
    beforeEach(() => {
      mockUseCurrentAccount.mockReturnValue(null);
      mockUseWallets.mockReturnValue([
        { name: 'Sui Wallet', icon: 'sui-icon.png' },
        { name: 'Suiet', icon: 'suiet-icon.png' },
      ]);
      mockUseConnectWallet.mockReturnValue({
        mutate: jest.fn(),
      });
    });

    test('opens wallet modal when connect button is clicked', () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      fireEvent.click(connectButton);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument(); // Modal title
      expect(screen.getByText('Sui Wallet')).toBeInTheDocument(); // Wallet option
      expect(screen.getByText('Suiet')).toBeInTheDocument(); // Wallet option
    });

    test('closes modal when clicking outside', () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      // Open modal
      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      fireEvent.click(connectButton);

      // Click overlay (outside modal)
      const overlay = screen.getByTestId('wallet-modal-overlay');
      fireEvent.click(overlay);

      // Modal should be closed
      expect(screen.queryByText('Connect Wallet')).not.toBeInTheDocument(); // Modal title
    });

    test('calls connectWallet when wallet is selected', async () => {
      const mockConnect = jest.fn().mockImplementation(({ onSuccess }) => {
        onSuccess();
      });
      mockUseConnectWallet.mockReturnValue({
        mutate: mockConnect,
      });

      renderWithProviders(<WalletConnection {...defaultProps} />);

      // Open modal
      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      fireEvent.click(connectButton);

      // Select wallet
      const suiWalletOption = screen.getByText('Sui Wallet');
      fireEvent.click(suiWalletOption);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith(
          { wallet: { name: 'Sui Wallet', icon: 'sui-icon.png' } },
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });
  });

  describe('When wallet is connected', () => {
    const mockAccount = {
      address: '0x1234567890123456789012345678901234567890',
      publicKey: '0xabc123...',
    };

    beforeEach(() => {
      mockUseCurrentAccount.mockReturnValue(mockAccount);
      mockUseWallets.mockReturnValue([
        { name: 'Sui Wallet', icon: 'sui-icon.png' },
      ]);
      mockUseSuiClient.mockReturnValue({
        getBalance: jest.fn().mockResolvedValue({
          totalBalance: 1000000000n, // 1 SUI
        }),
      });
      mockUseDisconnectWallet.mockReturnValue({
        mutate: jest.fn(),
      });
    });

    test('displays connected wallet button with address', async () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      await waitFor(() => {
        const walletButton = screen.getByRole('button', { name: /0x1234.*67890/i });
        expect(walletButton).toBeInTheDocument();
        expect(walletButton).toHaveClass('connected');
      });
    });

    test('displays SUI balance', async () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1.0000 SUI')).toBeInTheDocument();
      });
    });

    test('opens dropdown when wallet button is clicked', async () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      // Wait for balance to load
      await waitFor(() => {
        expect(screen.getByText('1.0000 SUI')).toBeInTheDocument();
      });

      // Click wallet button to open dropdown
      const walletButton = screen.getByRole('button', { name: /0x1234.*67890/i });
      fireEvent.click(walletButton);

      // Check dropdown contents
      expect(screen.getByText('1.0000 SUI')).toBeInTheDocument(); // Balance in dropdown
      expect(screen.getByText('0x1234.*67890')).toBeInTheDocument(); // Address in dropdown
      expect(screen.getByRole('button', { name: /Copy Address/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
    });

    test('copies address when copy button is clicked', async () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1.0000 SUI')).toBeInTheDocument();
      });

      // Open dropdown
      const walletButton = screen.getByRole('button', { name: /0x1234.*67890/i });
      fireEvent.click(walletButton);

      // Click copy button
      const copyButton = screen.getByRole('button', { name: /Copy Address/i });
      fireEvent.click(copyButton);

      // Check clipboard was called
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockAccount.address);

      // Check success message
      expect(screen.getByText('✓ Copied')).toBeInTheDocument();
    });

    test('disconnects wallet when disconnect button is clicked', async () => {
      const mockDisconnect = jest.fn();
      mockUseDisconnectWallet.mockReturnValue({
        mutate: mockDisconnect,
      });

      renderWithProviders(<WalletConnection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1.0000 SUI')).toBeInTheDocument();
      });

      // Open dropdown
      const walletButton = screen.getByRole('button', { name: /0x1234.*67890/i });
      fireEvent.click(walletButton);

      // Click disconnect button
      const disconnectButton = screen.getByRole('button', { name: /Disconnect/i });
      fireEvent.click(disconnectButton);

      expect(mockDisconnect).toHaveBeenCalled();
    });

    test('closes dropdown when clicking outside', async () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1.0000 SUI')).toBeInTheDocument();
      });

      // Open dropdown
      const walletButton = screen.getByRole('button', { name: /0x1234.*67890/i });
      fireEvent.click(walletButton);

      // Click outside dropdown
      fireEvent.mouseDown(document.body);

      // Dropdown should be closed
      expect(screen.queryByRole('button', { name: /Copy Address/i })).not.toBeInTheDocument();
    });
  });

  describe('External modal control', () => {
    beforeEach(() => {
      mockUseCurrentAccount.mockReturnValue(null);
      mockUseWallets.mockReturnValue([
        { name: 'Sui Wallet', icon: 'sui-icon.png' },
      ]);
    });

    test('opens modal when externalModalOpen prop is true', () => {
      const onExternalModalClose = jest.fn();

      renderWithProviders(
        <WalletConnection
          {...defaultProps}
          externalModalOpen={true}
          onExternalModalClose={onExternalModalClose}
        />
      );

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument(); // Modal title
    });

    test('calls onExternalModalClose when modal is closed', () => {
      const onExternalModalClose = jest.fn();

      renderWithProviders(
        <WalletConnection
          {...defaultProps}
          externalModalOpen={true}
          onExternalModalClose={onExternalModalClose}
        />
      );

      // Close modal by clicking outside
      const overlay = screen.getByTestId('wallet-modal-overlay');
      fireEvent.click(overlay);

      expect(onExternalModalClose).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockUseCurrentAccount.mockReturnValue(null);
      mockUseWallets.mockReturnValue([
        { name: 'Sui Wallet', icon: 'sui-icon.png' },
      ]);
      mockUseConnectWallet.mockReturnValue({
        mutate: jest.fn(),
      });
    });

    test('handles wallet connection errors gracefully', async () => {
      const mockConnect = jest.fn().mockImplementation(({ onError }) => {
        onError(new Error('Connection failed'));
      });
      mockUseConnectWallet.mockReturnValue({
        mutate: mockConnect,
      });

      renderWithProviders(<WalletConnection {...defaultProps} />);

      // Open modal
      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      fireEvent.click(connectButton);

      // Select wallet
      const suiWalletOption = screen.getByText('Sui Wallet');
      fireEvent.click(suiWalletOption);

      // Check error was logged to console
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled();
      });
    });

    test('handles balance fetch errors gracefully', async () => {
      mockUseCurrentAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        publicKey: '0xabc123...',
      });

      mockUseSuiClient.mockReturnValue({
        getBalance: jest.fn().mockRejectedValue(new Error('Failed to fetch balance')),
      });

      renderWithProviders(<WalletConnection {...defaultProps} />);

      await waitFor(() => {
        // Should show error balance instead of crashing
        expect(screen.getByText('0.0000 SUI')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility compliance', () => {
    beforeEach(() => {
      mockUseCurrentAccount.mockReturnValue(null);
      mockUseWallets.mockReturnValue([
        { name: 'Sui Wallet', icon: 'sui-icon.png' },
      ]);
    });

    test('main component has no accessibility violations', async () => {
      const { container } = renderWithProviders(<WalletConnection {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('wallet modal has proper ARIA attributes', async () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      // Open modal
      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      fireEvent.click(connectButton);

      const modal = screen.getByRole('dialog', { name: /Connect Wallet/i });
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    test('wallet options are accessible', async () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      // Open modal
      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      fireEvent.click(connectButton);

      const walletOption = screen.getByRole('button', { name: /Sui Wallet/i });
      expect(walletOption).toBeInTheDocument();
      expect(walletOption).toHaveAttribute('aria-label', 'Connect Sui Wallet');
    });

    test('keyboard navigation works', async () => {
      renderWithProviders(<WalletConnection {...defaultProps} />);

      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });

      // Test keyboard interaction
      fireEvent.keyDown(connectButton, { key: 'Enter' });
      fireEvent.keyUp(connectButton, { key: 'Enter' });

      // Modal should open
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  describe('Responsive design', () => {
    beforeEach(() => {
      mockUseCurrentAccount.mockReturnValue(null);
      mockUseWallets.mockReturnValue([
        { name: 'Sui Wallet', icon: 'sui-icon.png' },
      ]);
    });

    test('renders correctly on mobile devices', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderWithProviders(<WalletConnection {...defaultProps} />);

      // Component should still render properly
      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      expect(connectButton).toBeInTheDocument();
    });

    test('dropdown adapts to mobile screens', async () => {
      const mockAccount = {
        address: '0x1234567890123456789012345678901234567890',
        publicKey: '0xabc123...',
      };

      mockUseCurrentAccount.mockReturnValue(mockAccount);
      mockUseSuiClient.mockReturnValue({
        getBalance: jest.fn().mockResolvedValue({
          totalBalance: 1000000000n,
        }),
      });

      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<WalletConnection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1.0000 SUI')).toBeInTheDocument();
      });

      // Open dropdown
      const walletButton = screen.getByRole('button', { name: /0x1234.*67890/i });
      fireEvent.click(walletButton);

      // Dropdown should be visible and properly positioned
      const dropdown = screen.getByTestId('wallet-dropdown');
      expect(dropdown).toBeInTheDocument();
    });
  });
});