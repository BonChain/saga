/**
 * Transaction service for SuiSaga gameplay interactions
 * Provides utility functions for creating and managing transactions
 */

import type { SuiTransactionBlock } from '@mysten/sui/client';
import type { WalletTransaction } from '../types/wallet';

export interface GameActionTransaction {
  type: 'move' | 'mint' | 'upgrade' | 'battle' | 'trade';
  action: string;
  parameters: Record<string, any>;
}

/**
 * Service for handling gameplay transactions
 */
export class TransactionService {
  /**
   * Create a move transaction for character movement
   */
  static createMoveTransaction(
    from: string,
    to: string,
    _actionType: string
  ): SuiTransactionBlock {
    return {
      kind: 'programmableTransaction',
      inputs: [
        {
          type: 'object',
          objectType: 'moveCall',
          objectTypeType: 'package',
          packageObjectId: from,
        },
        {
          type: 'object',
          objectType: 'moveCall',
          objectTypeType: 'package',
          packageObjectId: to,
        },
        {
          type: 'u64',
          value: 0n,
        },
        {
          type: 'vector',
          typeParameter: 'u8',
        },
        {
          type: 'vector',
          typeParameter: 'u8',
        },
        {
          type: 'u32',
          value: 1,
        },
        {
          type: 'address',
          value: '0x5c7d332c3099631437e21ecabf1ab534aa16a7142c0a1',
        },
      ],
    } as unknown as SuiTransactionBlock;
  }

  /**
   * Create a simple coin transfer transaction
   */
  static createTransferTransaction(
    from: string,
    to: string,
    amount: number
  ): SuiTransactionBlock {
    return {
      kind: 'paySui',
      inputs: [
        {
          type: 'object',
          objectType: 'address',
          objectTypeType: 'address',
          address: from,
        },
        {
          type: 'vector',
          typeParameter: 'address',
          typeArgs: [to],
        },
        {
          type: 'vector',
          typeParameter: 'u64',
          typeArgs: [BigInt(amount * 1000000000)], // Convert SUI to MIST
        },
      ],
    } as unknown as SuiTransactionBlock;
  }

  /**
   * Create a transaction for game actions (mint, upgrade, etc.)
   */
  static createGameActionTransaction(
    contractAddress: string,
    module: string,
    functionName: string,
    args: any[],
    _gasBudget?: number
  ): SuiTransactionBlock {
    return {
      kind: 'programmableTransaction',
      inputs: [
        {
          type: 'object',
          objectType: 'moveCall',
          objectTypeType: 'package',
          packageObjectId: contractAddress,
        },
        {
          type: 'vector',
          typeParameter: 'u8',
          typeArgs: [
            Array.from(new TextEncoder().encode(module)),
            Array.from(new TextEncoder().encode(functionName)),
            Array.from(new TextEncoder().encode(JSON.stringify(args))),
          ],
        },
      ],
    } as unknown as SuiTransactionBlock;
  }

  /**
   * Create a batch transaction for multiple actions
   */
  static createBatchTransaction(
    transactions: SuiTransactionBlock[]
  ): SuiTransactionBlock {
    if (transactions.length === 0) {
      throw new Error('At least one transaction is required for a batch');
    }

    if (transactions.length === 1) {
      return transactions[0];
    }

    // For simplicity, we'll return the first transaction
    // In a real implementation, you'd use Sui's batch transaction features
    return transactions[0];
  }

  /**
   * Format transaction for display
   */
  static formatTransaction(transaction: WalletTransaction): string {
    return `${transaction.hash.slice(0, 8)}...${transaction.hash.slice(-8)}`;
  }

  /**
   * Check if a transaction succeeded
   */
  static isTransactionSuccessful(transaction: WalletTransaction): boolean {
    return transaction.effects?.status?.status === 'success';
  }

  /**
   * Get transaction status description
   */
  static getTransactionStatus(transaction: WalletTransaction): string {
    if (transaction.effects?.status?.status === 'success') {
      return '✅ Success';
    } else if (transaction.effects?.status?.status === 'failure') {
      return '❌ Failed';
    } else {
      return '⏳ Pending';
    }
  }

  /**
   * Estimate gas cost for transaction (simplified)
   */
  static estimateGasCost(transactionType: GameActionTransaction['type']): number {
    const gasCosts = {
      move: 1000,
      mint: 5000,
      upgrade: 2000,
      battle: 1500,
      trade: 800,
    };
    return gasCosts[transactionType] || 1000;
  }

  /**
   * Validate transaction before signing
   */
  static validateTransaction(transaction: SuiTransactionBlock): boolean {
    try {
      // Basic validation
      if (!transaction || typeof transaction !== 'object') {
        return false;
      }

      // Check if transaction has required fields (cast to access properties)
      const tx = transaction as unknown as { kind?: string; inputs?: unknown[] };
      if (!tx.kind || !tx.inputs) {
        return false;
      }

      // Additional validation logic can be added here
      return true;
    } catch (error) {
      console.error('Transaction validation error:', error);
      return false;
    }
  }

  /**
   * Create a payment transaction for game fees
   */
  static createPaymentTransaction(
    recipient: string,
    amount: number,
    _memo?: string
  ): SuiTransactionBlock {
    const inputs = [
        {
          type: 'object',
          objectType: 'address',
          objectTypeType: 'address',
          address: '0x0', // System address or treasury
        },
        {
          type: 'vector',
          typeParameter: 'address',
          typeArgs: [recipient],
        },
        {
          type: 'vector',
          typeParameter: 'u64',
          typeArgs: [BigInt(amount * 1000000000)], // Convert to MIST
        },
      ];

      if (_memo) {
        inputs.push({
          type: 'vector',
          typeParameter: 'u8',
          typeArgs: Array.from(new TextEncoder().encode(_memo)).map(num => num.toString()),
        });
      }

      return {
        kind: 'paySui',
        inputs,
      } as unknown as SuiTransactionBlock;
    }

  /**
   * Format gas cost for display
   */
  static formatGasCost(gasCost: number): string {
    if (gasCost < 1000) {
      return `${gasCost} gas`;
    } else {
      return `${(gasCost / 1000).toFixed(1)}k gas`;
    }
  }
}

export default TransactionService;