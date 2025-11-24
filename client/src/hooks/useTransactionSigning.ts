/**
 * Custom hook for transaction signing with SuiSaga
 * Provides transaction signing functionality for gameplay interactions
 */

import { useState, useCallback, useEffect } from 'react';
import { useCurrentAccount, useSignTransaction } from '@mysten/dapp-kit';
import type {
  WalletTransaction,
  WalletError,
  TransactionSigningResult
} from '../types/wallet';
import type { SuiTransactionBlock } from '@mysten/sui/client';

export interface TransactionSigningOptions {
  onSignSuccess?: (transaction: WalletTransaction) => void;
  onSignError?: (error: WalletError) => void;
  onSignStart?: () => void;
  timeout?: number;
}

export interface TransactionSigningState {
  isSigning: boolean;
  lastTransaction: WalletTransaction | null;
  error: WalletError | null;
  canSign: boolean;
}

/**
 * Custom hook for handling transaction signing
 */
export function useTransactionSigning(
  options?: TransactionSigningOptions
): TransactionSigningState & {
  signTransaction: (
    transactionData: SuiTransactionBlock,
    description?: string
  ) => Promise<TransactionSigningResult>;
  clearError: () => void;
} {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signTransactionWithKit } = useSignTransaction();

  const [state, setState] = useState<TransactionSigningState>({
    isSigning: false,
    lastTransaction: null,
    error: null,
    canSign: !!currentAccount,
  });

  // Update canSign status when account changes
  const updateCanSign = useCallback(() => {
    setState(prev => ({
      ...prev,
      canSign: !!currentAccount,
      error: prev.error && !currentAccount ? null : prev.error,
    }));
  }, [currentAccount]);

  useEffect(() => {
    updateCanSign();
  }, [updateCanSign]);

  // Clear error when account changes
  useEffect(() => {
    if (currentAccount && state.error) {
      setState(prev => ({
        ...prev,
        error: null,
      }));
    }
  }, [currentAccount, state.error]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const signTransaction = useCallback(async (
    transactionData: SuiTransactionBlock,
    _description?: string
  ): Promise<TransactionSigningResult> => {
    if (!currentAccount) {
      const error: WalletError = {
        code: 'CONNECTION_FAILED',
        message: 'No wallet connected',
        originalError: new Error('Cannot sign transaction without connected wallet'),
      };
      options?.onSignError?.(error);
      return { success: false, error };
    }

    try {
      setState(prev => ({ ...prev, isSigning: true, error: null }));
      options?.onSignStart?.();

      const result = await signTransactionWithKit(transactionData as any);

      // Create a wallet transaction from the signing result
      // Note: The actual structure may vary depending on the dApp-kit version
      const walletTransaction: WalletTransaction = {
        hash: typeof result === 'object' && result && 'digest' in result ? (result as any).digest : 'unknown',
        digest: typeof result === 'object' && result && 'digest' in result ? (result as any).digest : 'unknown',
        kind: 'user_transaction',
        effects: typeof result === 'object' && result && 'effects' in result ? (result as any).effects : { status: { status: 'success' } },
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        isSigning: false,
        lastTransaction: walletTransaction,
        error: null,
      }));

      options?.onSignSuccess?.(walletTransaction);
      return { success: true, transaction: walletTransaction };

    } catch (error) {
      console.error('Transaction signing failed:', error);

      let walletError: WalletError;
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          walletError = {
            code: 'USER_REJECTED',
            message: 'Transaction was cancelled by user',
            originalError: error,
          };
        } else if (error.message.includes('timeout')) {
          walletError = {
            code: 'TIMEOUT',
            message: 'Transaction signing timeout. Please try again.',
            originalError: error,
          };
        } else {
          walletError = {
            code: 'UNKNOWN',
            message: 'Failed to sign transaction',
            originalError: error,
          };
        }
      } else {
        walletError = {
          code: 'UNKNOWN',
          message: 'Failed to sign transaction',
          originalError: error as Error,
        };
      }

      setState(prev => ({
        ...prev,
        isSigning: false,
        error: walletError,
      }));

      options?.onSignError?.(walletError);
      return { success: false, error: walletError };
    }
  }, [currentAccount, signTransactionWithKit, options]);

  return {
    ...state,
    signTransaction,
    clearError,
  };
}