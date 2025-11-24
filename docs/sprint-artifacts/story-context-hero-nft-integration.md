# Story Context: Hero NFT Smart Contract Integration
**Story ID:** 8.4
**Epic:** Quick UX Integration
**Date:** 2025-11-23

---

## Executive Summary

This document provides comprehensive technical specifications and implementation guidance for Story 8.4: Hero NFT Smart Contract Integration. The implementation serves as the critical bridge between wallet authentication (Story 8.1) and active gameplay, creating permanent on-chain player identities through NFT minting. The solution emphasizes simplicity, gas efficiency, and seamless user experience optimized for hackathon demonstration success.

**Technical Approach:** Minimal smart contract design with focused frontend integration, leveraging existing Sui dApp Kit infrastructure and established patterns from the current codebase.

---

## 1. Technical Architecture Overview

### 1.1 System Integration Flow

```
Wallet Connected (Story 8.1)
       ↓
Check for Existing Hero NFT
       ↓
[No NFT] → Hero Creation UI → Mint Hero NFT → Gameplay
       ↓
[Has NFT] → Load Existing Hero → Gameplay
```

### 1.2 Component Architecture

```
App.tsx
├── WalletConnection (Story 8.1 - Complete)
├── HeroCreation (New - Story 8.4)
│   ├── CharacterClassSelector
│   ├── HeroNameInput
│   ├── TraitSelector
│   └── MintingButton
├── HeroDisplay (New - Story 8.4)
│   ├── HeroStats
│   ├── NFTVisualization
│   └── OwnershipVerification
└── GameInterface (Future)
```

### 1.3 Smart Contract Integration Pattern

```
Frontend → @mysten/dapp-kit → Sui Client → hero_nft.move → Sui Testnet
    ↓             ↓              ↓            ↓              ↓
  UI Events → Transaction → Execution → NFT Mint → Confirmation
```

---

## 2. Smart Contract Technical Specifications

### 2.1 Contract Structure: `hero_nft.move`

**Location:** `D:\work\hackathon\sagasaga-frontend\contract\move\source\hero_nft.move`

**Module:** `suisaga::hero_nft`

#### Core Data Structures

```move
module suisaga::hero_nft {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer::{Self, TransferPolicy};
    use std::vector;

    /// Hero NFT representing player's permanent identity
    public struct HeroNFT has key, store {
        id: UID,
        owner: address,
        name: String,
        class: u8,  // 0=Warrior, 1=Mage, 2=Rogue, 3=Hunter
        level: u8,
        experience: u64,
        traits: vector<String>,  // Appearance and personality traits
        stats: HeroStats,
        minted_at: u64,
    }

    /// Hero base statistics
    public struct HeroStats has store {
        strength: u8,    // Physical power
        intelligence: u8, // Magical aptitude
        agility: u8,     // Speed and reflexes
        vitality: u8,    // Health and endurance
        luck: u8,        // Random fortune factor
    }

    /// Contract configuration for minting
    public struct MintConfig has key {
        id: UID,
        mint_fee: u64,      // One-time minting cost
        max_supply: u64,    // Total heroes allowed
        current_supply: u64,
        paused: bool,       // Emergency pause switch
    }

    /// Events for blockchain tracking
    public struct HeroMinted has drop {
        hero_id: UID,
        owner: address,
        name: String,
        class: u8,
        timestamp: u64,
    }

    public struct HeroLeveledUp has drop {
        hero_id: UID,
        old_level: u8,
        new_level: u8,
        timestamp: u64,
    }
}
```

#### Key Functions Implementation

```move
/// Initialize the hero minting contract
public fun init(ctx: &mut TxContext) {
    let config = MintConfig {
        id: object::new(ctx),
        mint_fee: 1000000,  // 0.001 SUI in MIST
        max_supply: 1000000, // 1 million heroes
        current_supply: 0,
        paused: false,
    };
    transfer::public_transfer(&mut config);
}

/// Mint a new hero NFT
public fun mint_hero(
    config: &mut MintConfig,
    name: String,
    class: u8,
    traits: vector<String>,
    ctx: &mut TxContext
) {
    // Validation checks
    assert!(config.current_supply < config.max_supply, ENO_SUPPLY);
    assert!(!config.paused, MINTING_PAUSED);
    assert!(class <= 3, INVALID_CLASS);
    assert!(name.length() > 0 && name.length() <= 32, INVALID_NAME);

    // Generate stats based on class
    let stats = generate_base_stats(class);

    // Create hero NFT
    let hero = HeroNFT {
        id: object::new(ctx),
        owner: tx_context::sender(ctx),
        name,
        class,
        level: 1,
        experience: 0,
        traits,
        stats,
        minted_at: ctx.epoch_timestamp_ms(),
    };

    // Update supply
    config.current_supply = config.current_supply + 1;

    // Transfer to minting wallet
    transfer::public_transfer(&mut hero);

    // Emit event
    ctx.emit(HeroMinted {
        hero_id: object::id(&hero),
        owner: tx_context::sender(ctx),
        name: hero.name,
        class: hero.class,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

/// Generate base stats based on hero class
fun generate_base_stats(class: u8): HeroStats {
    if (class == 0) { // Warrior
        HeroStats {
            strength: 10,
            intelligence: 5,
            agility: 7,
            vitality: 9,
            luck: 6,
        }
    } else if (class == 1) { // Mage
        HeroStats {
            strength: 4,
            intelligence: 12,
            agility: 6,
            vitality: 5,
            luck: 8,
        }
    } else if (class == 2) { // Rogue
        HeroStats {
            strength: 7,
            intelligence: 8,
            agility: 11,
            vitality: 6,
            luck: 9,
        }
    } else { // Hunter (class == 3)
        HeroStats {
            strength: 8,
            intelligence: 7,
            agility: 10,
            vitality: 8,
            luck: 7,
        }
    }
}

/// Verify hero ownership
public fun verify_ownership(hero: &HeroNFT, owner: address): bool {
    hero.owner == owner
}

/// Get hero statistics
public fun get_hero_stats(hero: &HeroNFT): (u8, u64, &HeroStats) {
    (hero.level, hero.experience, &hero.stats)
}

/// Get hero class name
public fun get_class_name(class: u8): String {
    if (class == 0) String::from("Warrior")
    else if (class == 1) String::from("Mage")
    else if (class == 2) String::from("Rogue")
    else String::from("Hunter")
}
```

### 2.2 Gas Optimization Strategy

- **Minimal State:** Only essential hero data stored on-chain
- **Efficient Data Types:** u8/u64 instead of larger types where possible
- **Batch Operations:** Single transaction for hero creation
- **One-Time Fee:** Perpetual ownership with no recurring costs

### 2.3 Deployment Specifications

- **Network:** Sui Testnet
- **Package ID:** To be generated during deployment
- **Upgrade Policy:** Immutable (simple contract design)
- **Admin Functions:** Emergency pause and config management

---

## 3. Frontend Implementation Guidelines

### 3.1 Type System: `client/src/types/hero-nft.ts`

```typescript
/**
 * Hero NFT type definitions for SuiSaga
 * Provides type safety for NFT interactions and character creation
 */

import type { SuiAddress, SuiObjectRef } from '@mysten/sui';

// Hero class enumeration
export enum HeroClass {
  WARRIOR = 0,
  MAGE = 1,
  ROGUE = 2,
  HUNTER = 3,
}

// Hero class configuration
export interface HeroClassConfig {
  id: HeroClass;
  name: string;
  description: string;
  baseStats: HeroStats;
  iconUrl: string;
  colorTheme: string;
}

// Hero statistics structure
export interface HeroStats {
  strength: number;    // Physical power (1-20)
  intelligence: number; // Magical aptitude (1-20)
  agility: number;     // Speed and reflexes (1-20)
  vitality: number;    // Health and endurance (1-20)
  luck: number;        // Random fortune factor (1-20)
}

// Hero NFT structure (matches Move contract)
export interface HeroNFT {
  id: string;          // Object ID
  owner: SuiAddress;   // Owner address
  name: string;        // Hero name
  class: HeroClass;    // Hero class
  level: number;       // Current level (1-100)
  experience: number;  // Experience points
  traits: string[];    // Appearance traits
  stats: HeroStats;    // Base statistics
  mintedAt: number;    // Minting timestamp
}

// Character creation data
export interface CharacterCreationData {
  name: string;
  class: HeroClass;
  traits: string[];
  appearance: {
    hairStyle: string;
    hairColor: string;
    skinTone: string;
    eyeColor: string;
    outfit: string;
  };
}

// Transaction status
export type MintingStatus = 'idle' | 'estimating' | 'pending' | 'confirming' | 'completed' | 'failed';

// Minting transaction data
export interface MintingTransaction {
  status: MintingStatus;
  transactionId?: string;
  gasEstimate?: number;
  error?: string;
  heroId?: string;
}

// Hero ownership check result
export interface HeroOwnershipResult {
  hasHero: boolean;
  hero?: HeroNFT;
  objectId?: string;
  error?: string;
}

// Gas estimation result
export interface GasEstimation {
  baseCost: number;      // Base gas in MIST
  storageCost: number;   // Storage cost in MIST
  totalCost: number;     // Total cost in MIST
  costInSUI: number;     // Total cost in SUI
  estimatedTime: number; // Estimated confirmation time (seconds)
}

// Contract interaction events
export type HeroNFTEvent =
  | { type: 'MINTING_STARTED'; data: CharacterCreationData }
  | { type: 'GAS_ESTIMATED'; data: GasEstimation }
  | { type: 'TRANSACTION_SUBMITTED'; transactionId: string }
  | { type: 'MINTING_COMPLETED'; heroId: string; heroData: HeroNFT }
  | { type: 'MINTING_FAILED'; error: string; reason: string }
  | { type: 'HERO_LOADED'; hero: HeroNFT }
  | { type: 'OWNERSHIP_CHECK_FAILED'; error: string };

// Service configuration
export interface HeroNFTServiceConfig {
  contractAddress: string;
  packageId: string;
  network: 'testnet' | 'mainnet';
  gasBudget: number;    // Maximum gas budget per transaction
}

// Validation rules
export interface ValidationRules {
  nameMinLength: number;
  nameMaxLength: number;
  allowedNameChars: RegExp;
  maxTraits: number;
  prohibitedWords: string[];
}
```

### 3.2 Service Layer: `client/src/services/hero-nft-service.ts`

```typescript
/**
 * Hero NFT service for SuiSaga
 * Handles all smart contract interactions and NFT operations
 */

import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction, TransactionResult } from '@mysten/sui/transactions';
import type { SuiAddress, SuiObjectRef } from '@mysten/sui';
import type {
  HeroNFT, CharacterCreationData, HeroOwnershipResult,
  GasEstimation, MintingTransaction, HeroNFTServiceConfig
} from '../types/hero-nft';

export class HeroNFTService {
  private client: ReturnType<typeof useSuiClient>;
  private config: HeroNFTServiceConfig;

  constructor(client: ReturnType<typeof useSuiClient>, config: HeroNFTServiceConfig) {
    this.client = client;
    this.config = config;
  }

  /**
   * Check if user already owns a Hero NFT
   */
  async checkHeroOwnership(address: SuiAddress): Promise<HeroOwnershipResult> {
    try {
      // Query user's objects for Hero NFT
      const objects = await this.client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${this.config.packageId}::hero_nft::HeroNFT`
        },
        options: {
          showContent: true,
          showOwner: true,
        }
      });

      if (objects.data.length > 0) {
        const heroObject = objects.data[0];
        const heroData = this.parseHeroNFT(heroObject);

        return {
          hasHero: true,
          hero: heroData,
          objectId: heroObject.data?.objectId
        };
      }

      return { hasHero: false };
    } catch (error) {
      console.error('Hero ownership check failed:', error);
      return {
        hasHero: false,
        error: error instanceof Error ? error.message : 'Ownership check failed'
      };
    }
  }

  /**
   * Estimate gas cost for minting
   */
  async estimateMintingGas(data: CharacterCreationData): Promise<GasEstimation> {
    try {
      const tx = new Transaction();

      // Add mint_hero transaction
      tx.moveCall({
        target: `${this.config.packageId}::hero_nft::mint_hero`,
        arguments: [
          tx.object(this.config.contractAddress), // MintConfig
          tx.pure.string(data.name),
          tx.pure.u8(data.class),
          tx.pure.vector('String', data.traits)
        ]
      });

      // Set gas budget and get estimate
      tx.setGasBudget(this.config.gasBudget);

      // Dry run to get gas estimate
      const result = await this.client.dryRunTransaction({
        transactionBytes: await tx.build({ client: this.client })
      });

      const baseCost = result.effects?.gasUsed?.computationCost || 0;
      const storageCost = result.effects?.gasUsed?.storageCost || 0;
      const totalCost = Number(baseCost) + Number(storageCost);
      const costInSUI = totalCost / 1_000_000_000; // Convert MIST to SUI

      return {
        baseCost: Number(baseCost),
        storageCost: Number(storageCost),
        totalCost,
        costInSUI,
        estimatedTime: 10, // Approximate confirmation time
      };
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw new Error('Failed to estimate gas cost');
    }
  }

  /**
   * Mint a new Hero NFT
   */
  async mintHero(
    data: CharacterCreationData,
    onProgress?: (status: MintingTransaction) => void
  ): Promise<HeroNFT> {
    try {
      onProgress?.({ status: 'estimating' });

      // Create transaction
      const tx = new Transaction();

      tx.moveCall({
        target: `${this.config.packageId}::hero_nft::mint_hero`,
        arguments: [
          tx.object(this.config.contractAddress),
          tx.pure.string(data.name),
          tx.pure.u8(data.class),
          tx.pure.vector('String', data.traits)
        ]
      });

      tx.setGasBudget(this.config.gasBudget);

      onProgress?.({ status: 'pending' });

      // Execute transaction
      const result = await this.client.signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        }
      });

      onProgress?.({
        status: 'confirming',
        transactionId: result.digest
      });

      // Wait for confirmation
      const confirmedResult = await this.client.waitForTransaction({
        digest: result.digest,
        options: {
          showEffects: true,
          showObjectChanges: true,
        }
      });

      if (confirmedResult.effects?.status.status !== 'success') {
        throw new Error('Transaction failed');
      }

      onProgress?.({
        status: 'completed',
        transactionId: result.digest
      });

      // Parse created hero NFT
      const heroCreated = confirmedResult.objectChanges?.find(
        change => change.type === 'created' &&
        'objectType' in change &&
        change.objectType.includes('HeroNFT')
      );

      if (!heroCreated || !('objectId' in heroCreated)) {
        throw new Error('Hero NFT not found in transaction results');
      }

      // Get the full hero object
      const heroObject = await this.client.getObject({
        id: heroCreated.objectId,
        options: {
          showContent: true,
          showOwner: true,
        }
      });

      const heroData = this.parseHeroNFT(heroObject);

      onProgress?.({
        status: 'completed',
        transactionId: result.digest,
        heroId: heroCreated.objectId
      });

      return heroData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Minting failed';
      onProgress?.({
        status: 'failed',
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Parse Hero NFT object data
   */
  private parseHeroNFT(heroObject: any): HeroNFT {
    const content = heroObject.data?.content;
    if (!content || content.dataType !== 'moveObject') {
      throw new Error('Invalid Hero NFT object');
    }

    const fields = content.fields;

    return {
      id: heroObject.data?.objectId || '',
      owner: fields.owner || '',
      name: fields.name || '',
      class: Number(fields.class || 0),
      level: Number(fields.level || 1),
      experience: Number(fields.experience || 0),
      traits: fields.traits || [],
      stats: this.parseHeroStats(fields.stats),
      mintedAt: Number(fields.minted_at || 0),
    };
  }

  /**
   * Parse hero statistics
   */
  private parseHeroStats(stats: any): any {
    if (!stats || !stats.fields) {
      return {
        strength: 5,
        intelligence: 5,
        agility: 5,
        vitality: 5,
        luck: 5,
      };
    }

    return {
      strength: Number(stats.fields.strength || 5),
      intelligence: Number(stats.fields.intelligence || 5),
      agility: Number(stats.fields.agility || 5),
      vitality: Number(stats.fields.vitality || 5),
      luck: Number(stats.fields.luck || 5),
    };
  }

  /**
   * Get hero class configuration
   */
  getHeroClassConfig(classId: HeroClass) {
    const configs = {
      [HeroClass.WARRIOR]: {
        id: HeroClass.WARRIOR,
        name: 'Warrior',
        description: 'Masters of combat and physical strength',
        baseStats: { strength: 10, intelligence: 5, agility: 7, vitality: 9, luck: 6 },
        iconUrl: '/icons/warrior.svg',
        colorTheme: '#ff4444',
      },
      [HeroClass.MAGE]: {
        id: HeroClass.MAGE,
        name: 'Mage',
        description: 'Wielders of arcane magic and wisdom',
        baseStats: { strength: 4, intelligence: 12, agility: 6, vitality: 5, luck: 8 },
        iconUrl: '/icons/mage.svg',
        colorTheme: '#4444ff',
      },
      [HeroClass.ROGUE]: {
        id: HeroClass.ROGUE,
        name: 'Rogue',
        description: 'Swift and stealthy masters of shadows',
        baseStats: { strength: 7, intelligence: 8, agility: 11, vitality: 6, luck: 9 },
        iconUrl: '/icons/rogue.svg',
        colorTheme: '#44ff44',
      },
      [HeroClass.HUNTER]: {
        id: HeroClass.HUNTER,
        name: 'Hunter',
        description: 'Skilled trackers and wilderness survivors',
        baseStats: { strength: 8, intelligence: 7, agility: 10, vitality: 8, luck: 7 },
        iconUrl: '/icons/hunter.svg',
        colorTheme: '#ffaa44',
      },
    };

    return configs[classId];
  }
}
```

### 3.3 React Hooks: `client/src/hooks/useHeroNFT.ts`

```typescript
/**
 * Custom hook for Hero NFT operations
 * Manages state and interactions with Hero NFT service
 */

import { useState, useEffect, useCallback } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import type { SuiAddress } from '@mysten/sui';
import { HeroNFTService } from '../services/hero-nft-service';
import type {
  HeroNFT, CharacterCreationData, HeroOwnershipResult,
  MintingTransaction, HeroNFTEvent
} from '../types/hero-nft';

export function useHeroNFT() {
  const [heroOwnership, setHeroOwnership] = useState<HeroOwnershipResult>({ hasHero: false });
  const [mintingTransaction, setMintingTransaction] = useState<MintingTransaction>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = useSuiClient();
  const currentAccount = useCurrentAccount();

  // Initialize service
  const heroService = new HeroNFTService(client, {
    contractAddress: '0x...', // To be filled after contract deployment
    packageId: '0x...', // To be filled after contract deployment
    network: 'testnet',
    gasBudget: 50000000, // 0.05 SUI
  });

  // Check hero ownership when account changes
  useEffect(() => {
    if (currentAccount?.address) {
      checkHeroOwnership(currentAccount.address);
    } else {
      setHeroOwnership({ hasHero: false });
    }
  }, [currentAccount]);

  /**
   * Check if user owns a Hero NFT
   */
  const checkHeroOwnership = useCallback(async (address: SuiAddress) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await heroService.checkHeroOwnership(address);
      setHeroOwnership(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ownership check failed';
      setError(errorMessage);
      setHeroOwnership({ hasHero: false, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [heroService]);

  /**
   * Mint a new Hero NFT
   */
  const mintHero = useCallback(async (data: CharacterCreationData) => {
    setMintingTransaction({ status: 'estimating' });
    setError(null);

    try {
      const hero = await heroService.mintHero(data, setMintingTransaction);
      setHeroOwnership({ hasHero: true, hero });
      return hero;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Minting failed';
      setError(errorMessage);
      throw err;
    }
  }, [heroService]);

  /**
   * Get gas estimate for minting
   */
  const estimateGas = useCallback(async (data: CharacterCreationData) => {
    try {
      const estimate = await heroService.estimateMintingGas(data);
      return estimate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gas estimation failed';
      setError(errorMessage);
      throw err;
    }
  }, [heroService]);

  /**
   * Reset minting state
   */
  const resetMintingState = useCallback(() => {
    setMintingTransaction({ status: 'idle' });
    setError(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    heroOwnership,
    mintingTransaction,
    isLoading,
    error,

    // Actions
    checkHeroOwnership,
    mintHero,
    estimateGas,
    resetMintingState,
    clearError,

    // Computed
    hasHero: heroOwnership.hasHero,
    hero: heroOwnership.hero,
    isMinting: mintingTransaction.status === 'pending' || mintingTransaction.status === 'confirming',
    canMint: !heroOwnership.hasHero && currentAccount && !isLoading,
  };
}
```

### 3.4 Component Implementation: `client/src/components/HeroCreation.tsx`

```typescript
/**
 * HeroCreation component for SuiSaga
 * Character creation and NFT minting interface
 */

import React, { useState, useEffect } from 'react';
import { useHeroNFT } from '../hooks/useHeroNFT';
import type { HeroClass, CharacterCreationData } from '../types/hero-nft';
import './HeroCreation.css';

interface HeroCreationProps {
  onHeroCreated?: (heroId: string) => void;
  onCancel?: () => void;
}

export function HeroCreation({ onHeroCreated, onCancel }: HeroCreationProps) {
  const { heroClassConfigs } = useHeroNFT(); // Need to add this to hook
  const [step, setStep] = useState<'class' | 'name' | 'appearance' | 'review'>('class');
  const [creationData, setCreationData] = useState<Partial<CharacterCreationData>>({
    traits: [],
  });

  const { mintHero, estimateGas, mintingTransaction, error, clearError } = useHeroNFT();
  const [gasEstimate, setGasEstimate] = useState<number | null>(null);

  // Handle step progression
  const nextStep = () => {
    const steps: Array<'class' | 'name' | 'appearance' | 'review'> = ['class', 'name', 'appearance', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Array<'class' | 'name' | 'appearance' | 'review'> = ['class', 'name', 'appearance', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  // Handle class selection
  const selectClass = (heroClass: HeroClass) => {
    setCreationData(prev => ({ ...prev, class: heroClass }));
    nextStep();
  };

  // Handle name input
  const handleNameChange = (name: string) => {
    setCreationData(prev => ({ ...prev, name }));
  };

  // Handle name submission
  const submitName = () => {
    if (creationData.name && creationData.name.trim().length >= 2) {
      nextStep();
    }
  };

  // Handle appearance selection
  const handleAppearanceChange = (appearance: any) => {
    setCreationData(prev => ({
      ...prev,
      appearance,
      traits: Object.values(appearance).filter(Boolean) // Add appearance traits
    }));
  };

  // Final hero creation
  const createHero = async () => {
    try {
      if (!creationData.class || !creationData.name) {
        throw new Error('Missing required hero data');
      }

      // Estimate gas first
      const estimate = await estimateGas(creationData as CharacterCreationData);
      setGasEstimate(estimate.costInSUI);

      // Confirm minting
      const confirmed = window.confirm(
        `Mint your hero for ${estimate.costInSUI.toFixed(4)} SUI? This is a one-time cost.`
      );

      if (!confirmed) return;

      // Mint the hero
      const hero = await mintHero(creationData as CharacterCreationData);
      onHeroCreated?.(hero.id);

    } catch (err) {
      console.error('Hero creation failed:', err);
    }
  };

  // Clear error when step changes
  useEffect(() => {
    clearError();
  }, [step, clearError]);

  return (
    <div className="hero-creation">
      <div className="creation-container">
        <header className="creation-header">
          <h2>Create Your Hero</h2>
          <div className="progress-indicator">
            <div className={`progress-step ${step === 'class' ? 'active' : 'completed'}`}>Class</div>
            <div className={`progress-step ${step === 'name' ? 'active' : step.includes('class') ? 'completed' : ''}`}>Name</div>
            <div className={`progress-step ${step === 'appearance' ? 'active' : step === 'review' ? 'completed' : ''}`}>Appearance</div>
            <div className={`progress-step ${step === 'review' ? 'active' : ''}`}>Review</div>
          </div>
        </header>

        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={clearError} className="close-error">×</button>
          </div>
        )}

        <main className="creation-content">
          {step === 'class' && <ClassSelectionStep onSelectClass={selectClass} />}
          {step === 'name' && (
            <NameStep
              value={creationData.name || ''}
              onChange={handleNameChange}
              onSubmit={submitName}
            />
          )}
          {step === 'appearance' && (
            <AppearanceStep
              value={creationData.appearance || {}}
              onChange={handleAppearanceChange}
            />
          )}
          {step === 'review' && (
            <ReviewStep
              data={creationData as CharacterCreationData}
              gasEstimate={gasEstimate}
              onCreate={createHero}
              isMinting={mintingTransaction.status === 'pending' || mintingTransaction.status === 'confirming'}
            />
          )}
        </main>

        <footer className="creation-footer">
          <button onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          {step !== 'class' && step !== 'review' && (
            <button onClick={prevStep} className="back-button">
              Back
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

// Class selection step component
function ClassSelectionStep({ onSelectClass }: { onSelectClass: (class: HeroClass) => void }) {
  const { heroClassConfigs } = useHeroNFT();

  const classes = [
    { id: HeroClass.WARRIOR, name: 'Warrior', description: 'Masters of combat' },
    { id: HeroClass.MAGE, name: 'Mage', description: 'Wielders of magic' },
    { id: HeroClass.ROGUE, name: 'Rogue', description: 'Masters of stealth' },
    { id: HeroClass.HUNTER, name: 'Hunter', description: 'Skilled survivors' },
  ];

  return (
    <div className="class-selection">
      <h3>Choose Your Hero Class</h3>
      <div className="class-grid">
        {classes.map(heroClass => (
          <button
            key={heroClass.id}
            onClick={() => onSelectClass(heroClass.id)}
            className="class-card"
            style={{ borderColor: heroClassConfigs?.[heroClass.id]?.colorTheme }}
          >
            <div className="class-icon">
              <img src={heroClassConfigs?.[heroClass.id]?.iconUrl} alt={heroClass.name} />
            </div>
            <h4>{heroClass.name}</h4>
            <p>{heroClass.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Name input step component
function NameStep({
  value,
  onChange,
  onSubmit
}: {
  value: string;
  onChange: (name: string) => void;
  onSubmit: () => void;
}) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="name-step">
      <h3>Name Your Hero</h3>
      <div className="name-input-container">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your hero's name"
          maxLength={32}
          className="hero-name-input"
          autoFocus
        />
        <div className="name-counter">
          {value.length}/32 characters
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={value.trim().length < 2}
        className="continue-button"
      >
        Continue
      </button>
    </div>
  );
}

// Appearance selection step component
function AppearanceStep({
  value,
  onChange
}: {
  value: any;
  onChange: (appearance: any) => void;
}) {
  const appearanceOptions = {
    hairStyle: ['Short', 'Long', 'Bald', 'Spiky', 'Braided'],
    hairColor: ['Black', 'Brown', 'Blonde', 'Red', 'Silver', 'Green'],
    skinTone: ['Light', 'Medium', 'Dark', 'Tanned'],
    eyeColor: ['Brown', 'Blue', 'Green', 'Gray', 'Red', 'Purple'],
    outfit: ['Light Armor', 'Heavy Armor', 'Robes', 'Leather', 'Chainmail'],
  };

  return (
    <div className="appearance-step">
      <h3>Customize Your Hero's Appearance</h3>
      <div className="appearance-options">
        {Object.entries(appearanceOptions).map(([category, options]) => (
          <div key={category} className="appearance-category">
            <h4>{category.replace(/([A-Z])/g, ' $1').trim()}</h4>
            <div className="option-buttons">
              {options.map(option => (
                <button
                  key={option}
                  onClick={() => onChange({ ...value, [category]: option })}
                  className={`option-button ${value[category] === option ? 'selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {}}
        className="continue-button"
      >
        Continue
      </button>
    </div>
  );
}

// Review step component
function ReviewStep({
  data,
  gasEstimate,
  onCreate,
  isMinting
}: {
  data: CharacterCreationData;
  gasEstimate: number | null;
  onCreate: () => void;
  isMinting: boolean;
}) {
  return (
    <div className="review-step">
      <h3>Review Your Hero</h3>
      <div className="hero-review">
        <div className="hero-summary">
          <h4>{data.name}</h4>
          <p>Class: {HeroClass[data.class]}</p>
          <div className="hero-traits">
            {data.traits.map((trait, index) => (
              <span key={index} className="trait-tag">{trait}</span>
            ))}
          </div>
        </div>

        {gasEstimate && (
          <div className="gas-estimate">
            <h4>Minting Cost</h4>
            <p className="gas-amount">{gasEstimate.toFixed(4)} SUI</p>
            <p className="gas-note">One-time fee for permanent hero ownership</p>
          </div>
        )}
      </div>

      <div className="minting-actions">
        <button
          onClick={onCreate}
          disabled={isMinting}
          className="mint-button"
        >
          {isMinting ? 'Minting...' : 'Mint Hero'}
        </button>
      </div>
    </div>
  );
}

export enum HeroClass {
  WARRIOR = 0,
  MAGE = 1,
  ROGUE = 2,
  HUNTER = 3,
}
```

### 3.5 Component Styles: `client/src/components/HeroCreation.css`

```css
/**
 * HeroCreation component styles
 * Retro gaming aesthetic with neon effects
 */

.hero-creation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.creation-container {
  background: #1a1a1a;
  border: 2px solid #00ff00;
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
  font-family: 'Courier New', monospace;
}

.creation-header {
  text-align: center;
  margin-bottom: 2rem;
}

.creation-header h2 {
  color: #00ff00;
  font-size: 2rem;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
}

.progress-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.progress-step {
  flex: 1;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  padding: 0.5rem;
  position: relative;
}

.progress-step.active {
  color: #00ff00;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.8);
}

.progress-step.completed {
  color: #00cc00;
}

.progress-step:not(:last-child)::after {
  content: '→';
  position: absolute;
  right: -1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #444;
}

.error-message {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff0000;
  color: #ff6666;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-error {
  background: none;
  border: none;
  color: #ff6666;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  margin-left: 1rem;
}

.class-selection {
  text-align: center;
}

.class-selection h3 {
  color: #00ff00;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.class-card {
  background: #2a2a2a;
  border: 2px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.class-card:hover {
  border-color: #00ff00;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  transform: translateY(-2px);
}

.class-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
  background: #333;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.class-card h4 {
  color: #00ff00;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.class-card p {
  color: #ccc;
  font-size: 0.9rem;
  margin: 0;
}

.name-step {
  text-align: center;
}

.name-step h3 {
  color: #00ff00;
  margin-bottom: 2rem;
}

.name-input-container {
  margin-bottom: 2rem;
}

.hero-name-input {
  background: #2a2a2a;
  border: 2px solid #444;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  padding: 1rem;
  border-radius: 4px;
  width: 100%;
  max-width: 300px;
  text-align: center;
  transition: border-color 0.3s ease;
}

.hero-name-input:focus {
  outline: none;
  border-color: #00ff00;
  box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
}

.name-counter {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.continue-button {
  background: linear-gradient(135deg, #00ff00, #00cc00);
  border: none;
  color: #000;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: bold;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.continue-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #00ff00, #00aa00);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 255, 0, 0.3);
}

.continue-button:disabled {
  background: #444;
  color: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.appearance-step {
  text-align: center;
}

.appearance-step h3 {
  color: #00ff00;
  margin-bottom: 2rem;
}

.appearance-options {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 1rem;
}

.appearance-category {
  margin-bottom: 1.5rem;
}

.appearance-category h4 {
  color: #00cc00;
  margin-bottom: 1rem;
  text-transform: capitalize;
}

.option-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.option-button {
  background: #2a2a2a;
  border: 1px solid #444;
  color: #ccc;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
}

.option-button:hover {
  border-color: #00ff00;
  color: #00ff00;
}

.option-button.selected {
  background: #00ff00;
  border-color: #00ff00;
  color: #000;
  box-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
}

.review-step {
  text-align: center;
}

.review-step h3 {
  color: #00ff00;
  margin-bottom: 2rem;
}

.hero-review {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.hero-summary h4 {
  color: #00ff00;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
}

.hero-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.trait-tag {
  background: #333;
  color: #00cc00;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid #00cc00;
}

.gas-estimate {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #444;
}

.gas-estimate h4 {
  color: #00cc00;
  margin-bottom: 1rem;
}

.gas-amount {
  font-size: 2rem;
  color: #00ff00;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 8px rgba(0, 255, 0, 0.8);
}

.gas-note {
  color: #888;
  font-size: 0.9rem;
  margin: 0;
}

.mint-button {
  background: linear-gradient(135deg, #ff6600, #ff3300);
  border: none;
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 1rem 3rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.mint-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff7700, #ff4400);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(255, 102, 0, 0.4);
}

.mint-button:disabled {
  background: #444;
  color: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.creation-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #444;
}

.cancel-button {
  background: transparent;
  border: 1px solid #666;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
}

.cancel-button:hover {
  border-color: #ff0000;
  color: #ff6666;
}

.back-button {
  background: #333;
  border: 1px solid #666;
  color: #ccc;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
}

.back-button:hover {
  border-color: #00ff00;
  color: #00ff00;
}

/* Responsive Design */
@media (max-width: 768px) {
  .creation-container {
    width: 95%;
    padding: 1rem;
  }

  .class-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.5rem;
  }

  .class-card {
    padding: 1rem;
  }

  .appearance-options {
    max-height: 300px;
  }

  .creation-footer {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Scrollbar styling for retro theme */
.creation-container::-webkit-scrollbar,
.appearance-options::-webkit-scrollbar {
  width: 8px;
}

.creation-container::-webkit-scrollbar-track,
.appearance-options::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 4px;
}

.creation-container::-webkit-scrollbar-thumb,
.appearance-options::-webkit-scrollbar-thumb {
  background: #00ff00;
  border-radius: 4px;
}

.creation-container::-webkit-scrollbar-thumb:hover,
.appearance-options::-webkit-scrollbar-thumb:hover {
  background: #00cc00;
}
```

---

## 4. System Integration & Data Flow

### 4.1 Application State Management

```typescript
// Updated App.tsx integration
import { useHeroNFT } from './hooks/useHeroNFT';
import { HeroCreation } from './components/HeroCreation';
import { HeroDisplay } from './components/HeroDisplay';

function AppContent() {
  const currentAccount = useCurrentAccount();
  const { hasHero, hero, isLoading, canMint } = useHeroNFT();
  const [showHeroCreation, setShowHeroCreation] = useState(false);

  // Determine what to show
  const showContent = () => {
    if (!currentAccount) {
      // Show landing page (existing code)
      return <LandingPage />;
    }

    if (isLoading) {
      return <LoadingScreen message="Checking for existing hero..." />;
    }

    if (hasHero && hero) {
      // Show hero display and game interface
      return <HeroDisplay hero={hero} />;
    }

    if (canMint) {
      // Show hero creation
      return (
        <HeroCreation
          onHeroCreated={() => {
            setShowHeroCreation(false);
            // Hero will be automatically loaded
          }}
          onCancel={() => setShowHeroCreation(false)}
        />
      );
    }

    // Default: welcome screen with create hero option
    return (
      <WelcomeScreen
        onCreateHero={() => setShowHeroCreation(true)}
        hasWallet={!!currentAccount}
      />
    );
  };

  return (
    <div className="app">
      <header>
        <WalletConnection />
      </header>
      <main>
        {showContent()}
      </main>
    </div>
  );
}
```

### 4.2 Data Flow Diagram

```
User Connects Wallet
         ↓
Check Hero Ownership (useHeroNFT)
         ↓
    ┌─────────────┬─────────────┐
    │             │             │
  Has Hero     No Hero     Loading
    │             │             │
    ↓             ↓             ↓
HeroDisplay   HeroCreation  Loading
    │             │             │
    ↓             ↓             ↓
Gameplay     Character →   ←   Error
Interface     Creation     ←    ↓
    │             │          Retry
    ↓             │          │
Hero          NFT Mint     ←   ←
Stats          Service      ←
```

### 4.3 Error Handling Patterns

```typescript
// Centralized error handling in hero service
export class HeroNFTError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK_ERROR' | 'TRANSACTION_FAILED' | 'INSUFFICIENT_GAS' | 'CONTRACT_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'HeroNFTError';
  }
}

// Error recovery strategies
export const errorRecoveryStrategies = {
  NETWORK_ERROR: 'Please check your connection and try again',
  TRANSACTION_FAILED: 'Transaction failed. Please check gas and try again',
  INSUFFICIENT_GAS: 'Insufficient gas. Please add funds to your wallet',
  CONTRACT_ERROR: 'Contract error. Please contact support',
};
```

### 4.4 Integration with Existing Systems

#### Wallet Connection Integration
- Leverages existing `useAuthentication` hook for wallet state
- Uses current `WalletConnection` component for wallet selection
- Maintains same JWT authentication flow
- Hero ownership check happens after wallet authentication

#### Backend Integration
- Potentially extend `auth-service.ts` to track hero ownership
- Add hero metadata to user profiles for future features
- Maintain session persistence across hero creation

#### Smart Contract Architecture
- Separate contract from existing `suisaga.move` for simplicity
- Can be integrated later with world state systems
- Follows same deployment patterns as existing contracts

---

## 5. User Experience Flow Implementation

### 5.1 Complete User Journey

```
1. User lands on SuiSaga website
2. Clicks "Connect Wallet" / "Enter the Realm"
3. Selects and connects Sui wallet (Story 8.1 complete)
4. System checks for existing Hero NFT
   └─ If exists: Display hero and game interface
   └─ If none: Show welcome with "Create Your Hero" option
5. User clicks "Create Your Hero"
6. Hero Creation interface opens with step-by-step flow:
   - Step 1: Select Hero Class (Warrior, Mage, Rogue, Hunter)
   - Step 2: Enter Hero Name (with validation)
   - Step 3: Customize Appearance (hair, skin, outfit, etc.)
   - Step 4: Review and confirm with gas cost display
7. User confirms minting
8. Transaction shows status progress:
   - Estimating gas
   - Pending confirmation
   - Transaction confirmed
   - Hero NFT created
9. Success animation and transition to game interface
10. Hero stats displayed with ownership verification
```

### 5.2 Mobile Responsiveness Requirements

```css
/* Mobile-first responsive design for hero creation */
@media (max-width: 768px) {
  .hero-creation {
    padding: 1rem;
  }

  .class-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .class-card {
    padding: 1rem;
  }

  .hero-name-input {
    font-size: 1rem;
    padding: 0.75rem;
  }

  .option-buttons {
    justify-content: stretch;
  }

  .option-button {
    flex: 1;
    min-width: 100px;
  }
}
```

### 5.3 Accessibility Compliance

```typescript
// Accessibility features in HeroCreation component
const accessibleProps = {
  'aria-label': 'Hero class selection',
  'aria-describedby': 'Choose your hero class to determine abilities and appearance',
  role: 'group',
};

// Screen reader support for form validation
const getValidationMessage = (field: string, value: string): string => {
  switch (field) {
    case 'name':
      if (value.length < 2) return 'Hero name must be at least 2 characters';
      if (value.length > 32) return 'Hero name cannot exceed 32 characters';
      return 'Hero name is valid';
    default:
      return '';
  }
};
```

### 5.4 Retro Gaming Styling Implementation

The implementation maintains the existing retro gaming aesthetic with:
- **Neon green borders** (#00ff00) for primary UI elements
- **CRT monitor effects** with subtle scan lines and glow
- **Pixel-perfect fonts** using 'Courier New' monospace
- **8-bit inspired animations** for character sprites and effects
- **Synwave color palette** with dark backgrounds and bright accents
- **Glowing text effects** using text-shadow and CSS animations

---

## 6. Testing Strategy & Implementation

### 6.1 Unit Tests: `client/src/components/__tests__/HeroCreation.test.tsx`

```typescript
/**
 * HeroCreation component tests
 * Comprehensive testing for character creation flow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { HeroCreation } from '../HeroCreation';
import { HeroClass } from '../../types/hero-nft';

// Mock the useHeroNFT hook
jest.mock('../../hooks/useHeroNFT', () => ({
  useHeroNFT: () => ({
    heroClassConfigs: {
      [HeroClass.WARRIOR]: {
        name: 'Warrior',
        colorTheme: '#ff4444',
        iconUrl: '/warrior.svg',
      },
      [HeroClass.MAGE]: {
        name: 'Mage',
        colorTheme: '#4444ff',
        iconUrl: '/mage.svg',
      },
    },
    mintHero: jest.fn(),
    estimateGas: jest.fn(),
    mintingTransaction: { status: 'idle' },
    error: null,
    clearError: jest.fn(),
  }),
}));

describe('HeroCreation Component', () => {
  const mockOnHeroCreated = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders class selection step initially', () => {
    render(<HeroCreation onHeroCreated={mockOnHeroCreated} onCancel={mockOnCancel} />);

    expect(screen.getByText('Create Your Hero')).toBeInTheDocument();
    expect(screen.getByText('Choose Your Hero Class')).toBeInTheDocument();
    expect(screen.getByText('Warrior')).toBeInTheDocument();
    expect(screen.getByText('Mage')).toBeInTheDocument();
  });

  test('progresses through steps correctly', async () => {
    render(<HeroCreation onHeroCreated={mockOnHeroCreated} onCancel={mockOnCancel} />);

    // Step 1: Select class
    fireEvent.click(screen.getByText('Warrior'));

    await waitFor(() => {
      expect(screen.getByText('Name Your Hero')).toBeInTheDocument();
    });

    // Step 2: Enter name
    const nameInput = screen.getByPlaceholderText("Enter your hero's name");
    fireEvent.change(nameInput, { target: { value: 'TestHero' } });
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Customize Your Hero\'s Appearance')).toBeInTheDocument();
    });
  });

  test('validates hero name input', async () => {
    render(<HeroCreation onHeroCreated={mockOnHeroCreated} onCancel={mockOnCancel} />);

    // Navigate to name step
    fireEvent.click(screen.getByText('Warrior'));

    await waitFor(() => {
      expect(screen.getByText('Name Your Hero')).toBeInTheDocument();
    });

    // Test empty name
    const nameInput = screen.getByPlaceholderText("Enter your hero's name");
    const continueButton = screen.getByText('Continue');

    expect(continueButton).toBeDisabled();

    // Test valid name
    fireEvent.change(nameInput, { target: { value: 'ValidHero' } });
    expect(continueButton).not.toBeDisabled();
  });

  test('handles cancel correctly', () => {
    render(<HeroCreation onHeroCreated={mockOnHeroCreated} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('displays character limit correctly', async () => {
    render(<HeroCreation onHeroCreated={mockOnHeroCreated} onCancel={mockOnCancel} />);

    // Navigate to name step
    fireEvent.click(screen.getByText('Warrior'));

    await waitFor(() => {
      expect(screen.getByText('Name Your Hero')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("Enter your hero's name");
    const counter = screen.getByText('0/32 characters');

    fireEvent.change(nameInput, { target: { value: 'Test' } });
    expect(screen.getByText('4/32 characters')).toBeInTheDocument();
  });

  test('shows error messages when provided', () => {
    render(
      <HeroCreation
        onHeroCreated={mockOnHeroCreated}
        onCancel={mockOnCancel}
      />
    );

    // Mock error state would need to be injected through context or props
    // This test demonstrates error display functionality
  });
});

describe('Hero Creation Flow Integration', () => {
  test('complete hero creation flow', async () => {
    const mockMintHero = jest.fn().mockResolvedValue({
      id: 'test-hero-id',
      name: 'TestHero',
    });

    render(<HeroCreation onHeroCreated={mockOnHeroCreated} onCancel={mockOnCancel} />);

    // Complete all steps
    fireEvent.click(screen.getByText('Warrior')); // Step 1

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText("Enter your hero's name");
      fireEvent.change(nameInput, { target: { value: 'TestHero' } });
      fireEvent.click(screen.getByText('Continue'));
    });

    // Continue through remaining steps...

    // Final step should have mint button
    await waitFor(() => {
      expect(screen.getByText('Mint Hero')).toBeInTheDocument();
    });
  });
});
```

### 6.2 Integration Tests

```typescript
/**
 * Integration tests for Hero NFT service
 * Tests contract interaction and wallet integration
 */

import { HeroNFTService } from '../services/hero-nft-service';
import { mockSuiClient, mockTransactionResult } from './mocks/sui-client';

describe('HeroNFTService Integration', () => {
  let service: HeroNFTService;

  beforeEach(() => {
    service = new HeroNFTService(mockSuiClient, {
      contractAddress: '0x123...',
      packageId: '0x456...',
      network: 'testnet',
      gasBudget: 50000000,
    });
  });

  test('checkHeroOwnership finds existing hero', async () => {
    const result = await service.checkHeroOwnership('0xwallet...');

    expect(result.hasHero).toBe(true);
    expect(result.hero).toBeDefined();
    expect(result.hero?.name).toBe('TestHero');
  });

  test('estimateMintingGas returns cost estimate', async () => {
    const data = {
      name: 'TestHero',
      class: HeroClass.WARRIOR,
      traits: ['Brave'],
    };

    const estimate = await service.estimateMintingGas(data);

    expect(estimate.costInSUI).toBeGreaterThan(0);
    expect(estimate.estimatedTime).toBeGreaterThan(0);
  });

  test('mintHero creates new NFT successfully', async () => {
    const data = {
      name: 'TestHero',
      class: HeroClass.WARRIOR,
      traits: ['Brave'],
      appearance: {
        hairStyle: 'Short',
        hairColor: 'Brown',
      },
    };

    const onProgress = jest.fn();
    const hero = await service.mintHero(data, onProgress);

    expect(hero.name).toBe('TestHero');
    expect(hero.class).toBe(HeroClass.WARRIOR);
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
      status: 'completed',
    }));
  });
});
```

### 6.3 E2E Tests

```typescript
/**
 * End-to-end tests for hero creation flow
 * Tests complete user journey from wallet connection to hero ownership
 */

import { test, expect } from '@playwright/test';

test.describe('Hero Creation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Mock wallet connection
    await page.evaluate(() => {
      window.mockWallet = {
        address: '0x123...',
        connect: () => Promise.resolve(),
        signTransaction: () => Promise.resolve({ signature: 'mock-signature' }),
      };
    });
  });

  test('complete hero creation journey', async ({ page }) => {
    // Step 1: Connect wallet
    await page.click('[data-testid="connect-wallet"]');
    await page.click('[data-testid="wallet-option-sui"]');
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible();

    // Step 2: Check for existing hero (should be none)
    await expect(page.locator('[data-testid="welcome-screen"]')).toBeVisible();

    // Step 3: Start hero creation
    await page.click('[data-testid="create-hero-button"]');

    // Step 4: Select class
    await page.click('[data-testid="class-warrior"]');

    // Step 5: Enter name
    await page.fill('[data-testid="hero-name-input"]', 'TestHero');
    await page.click('[data-testid="continue-button"]');

    // Step 6: Select appearance
    await page.click('[data-testid="hair-style-short"]');
    await page.click('[data-testid="continue-button"]');

    // Step 7: Review and mint
    await expect(page.locator('[data-testid="review-step"]')).toBeVisible();
    await expect(page.locator('[data-testid="gas-estimate"]')).toBeVisible();

    await page.click('[data-testid="mint-hero-button"]');

    // Step 8: Verify completion
    await expect(page.locator('[data-testid="hero-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="hero-name"]')).toHaveText('TestHero');
  });

  test('returns to existing hero if already owned', async ({ page }) => {
    // Mock existing hero ownership
    await page.evaluate(() => {
      window.mockHero = {
        id: 'existing-hero-id',
        name: 'ExistingHero',
        class: 1,
      };
    });

    await page.click('[data-testid="connect-wallet"]');
    await page.click('[data-testid="wallet-option-sui"]');

    // Should skip creation and show existing hero
    await expect(page.locator('[data-testid="hero-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="hero-name"]')).toHaveText('ExistingHero');
  });

  test('handles minting errors gracefully', async ({ page }) => {
    // Mock minting failure
    await page.evaluate(() => {
      window.mockTransactionFailure = true;
    });

    await page.click('[data-testid="connect-wallet"]');
    await page.click('[data-testid="wallet-option-sui"]');
    await page.click('[data-testid="create-hero-button"]');

    // Complete creation flow
    await page.click('[data-testid="class-warrior"]');
    await page.fill('[data-testid="hero-name-input"]', 'TestHero');
    await page.click('[data-testid="continue-button"]');
    await page.click('[data-testid="continue-button"]');
    await page.click('[data-testid="mint-hero-button"]');

    // Should show error and allow retry
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="mint-hero-button"]')).toBeVisible();
  });
});
```

---

## 7. Deployment & Configuration

### 7.1 Smart Contract Deployment

```bash
# Deploy Hero NFT contract to Sui Testnet
cd contract/move
sui client publish --gas-budget 10000000

# Record the deployed package and object IDs:
# Package ID: 0x... (to be recorded in frontend config)
# MintConfig Object ID: 0x... (to be recorded in frontend config)
```

### 7.2 Environment Configuration

```typescript
// client/src/config/hero-nft.ts
export const HERO_NFT_CONFIG = {
  // Testnet configuration
  testnet: {
    contractAddress: import.meta.env.VITE_HERO_CONTRACT_ADDRESS || '0x...',
    packageId: import.meta.env.VITE_HERO_PACKAGE_ID || '0x...',
    network: 'testnet' as const,
    gasBudget: parseInt(import.meta.env.VITE_HERO_GAS_BUDGET || '50000000'),
  },

  // Mainnet configuration (future)
  mainnet: {
    contractAddress: import.meta.env.VITE_HERO_CONTRACT_ADDRESS_MAINNET || '',
    packageId: import.meta.env.VITE_HERO_PACKAGE_ID_MAINNET || '',
    network: 'mainnet' as const,
    gasBudget: parseInt(import.meta.env.VITE_HERO_GAS_BUDGET_MAINNET || '100000000'),
  },

  // Get current configuration based on environment
  current: () => {
    const network = import.meta.env.VITE_SUI_NETWORK || 'testnet';
    return HERO_NFT_CONFIG[network as keyof typeof HERO_NFT_CONFIG];
  },
};
```

### 7.3 Environment Variables

```bash
# .env.local
# Sui Network Configuration
VITE_SUI_NETWORK=testnet
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Hero NFT Contract Configuration
VITE_HERO_CONTRACT_ADDRESS=0x...  # MintConfig object ID after deployment
VITE_HERO_PACKAGE_ID=0x...        # Package ID after deployment
VITE_HERO_GAS_BUDGET=50000000     # Maximum gas budget per transaction

# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_AUTH_TIMEOUT=30000
VITE_SESSION_STORAGE_KEY=suisaga_auth_token
```

---

## 8. Hackathon Success Criteria & Demo Optimization

### 8.1 Critical Success Metrics

**Functional Requirements:**
- ✅ Hero NFT minting success rate: >95%
- ✅ Transaction confirmation time: <30 seconds
- ✅ Gas cost: <0.01 SUI per mint
- ✅ Wallet-to-hero creation time: <3 minutes
- ✅ Error recovery success rate: >90%

**User Experience Requirements:**
- ✅ Character creation completion rate: >80%
- ✅ Understanding of NFT ownership: 100% of demo participants
- ✅ Mobile compatibility: Full functionality on mobile devices
- ✅ Browser compatibility: Chrome, Firefox, Safari, Edge

**Demo Requirements:**
- ✅ Judge understanding: Clear connection between wallet and NFT identity
- ✅ Visual appeal: Impressive retro gaming aesthetics
- ✅ Technical demonstration: Working blockchain transaction
- ✅ Innovation showcase: Permanent player identity concept

### 8.2 Demo Flow Script

```
1. Introduction (30 seconds)
   "SuiSaga creates permanent player identities through Hero NFTs"

2. Wallet Connection (45 seconds)
   - Click "Connect Wallet"
   - Select Sui wallet
   - Show connected address

3. Hero Creation (2 minutes)
   - "As a new player, you create your permanent identity"
   - Select Warrior class
   - Enter "Chronos" as hero name
   - Customize appearance
   - Show gas cost estimate (0.001 SUI)

4. NFT Minting (1 minute)
   - Click "Mint Hero"
   - Show transaction progress
   - Confirm on wallet
   - Wait for confirmation

5. Hero Display (1 minute)
   - Show created Hero NFT with stats
   - Explain: "This is now your permanent identity"
   - Show blockchain verification link
   - Demo returning player recognition

6. Conclusion (30 seconds)
   "Every action you take will be tied to this hero identity,
    creating your permanent legacy in the living world"
```

### 8.3 Risk Mitigation Strategies

**Technical Risks:**
- **Network Congestion:** Have demo account pre-funded with sufficient gas
- **Wallet Issues:** Support multiple popular Sui wallets
- **Contract Bugs:** Thoroughly test on devnet before testnet deployment
- **Browser Compatibility:** Test on multiple browsers before demo

**Demo Risks:**
- **Time Constraints:** Practice demo flow multiple times
- **Live Failures:** Have recorded backup video as fallback
- **Judge Questions:** Prepare detailed technical explanations
- **Network Issues:** Have mobile hotspot as backup internet

### 8.4 Performance Optimization

```typescript
// Performance monitoring for hero creation
const performanceMonitor = {
  startTime: 0,

  startTiming() {
    this.startTime = performance.now();
  },

  measureStep(stepName: string) {
    const duration = performance.now() - this.startTime;
    console.log(`${stepName} completed in ${duration.toFixed(2)}ms`);
    return duration;
  },

  // Log performance metrics
  logMetrics(metrics: { [key: string]: number }) {
    // Send to performance monitoring service
    if (import.meta.env.DEV) {
      console.table(metrics);
    }
  },
};

// Usage in hero creation
performanceMonitor.startTiming();
await mintHero(data);
const mintingTime = performanceMonitor.measureStep('Hero Minting');
performanceMonitor.logMetrics({ heroMinting: mintingTime });
```

---

## 9. Future Enhancement Roadmap

### 9.1 Immediate Post-Hackathon Enhancements

1. **Hero Leveling System**
   - Add experience gain from game actions
   - Implement level-up mechanics
   - Enhanced stat progression

2. **Hero Customization Expansion**
   - Additional appearance options
   - Equipment and accessories
   - Hero avatar generation

3. **Guild and Social Features**
   - Hero guild membership NFTs
   - Friend system and hero profiles
   - Leaderboards and achievements

### 9.2 Long-term Vision

1. **Multi-Hero System**
   - Allow multiple heroes per wallet
   - Hero switching and party systems
   - Specialized hero roles

2. **Cross-World Integration**
   - Hero NFTs usable across multiple game worlds
   - Interoperable hero systems
   - Marketplace for hero trading

3. **AI-Powered Personalization**
   - AI-generated backstories
   - Dynamic trait evolution
   - Personality-based gameplay

### 9.3 Technical Debt & Improvements

1. **Contract Optimization**
   - Gas-efficient storage patterns
   - Upgradeable contract architecture
   - Cross-chain compatibility

2. **Frontend Enhancements**
   - Advanced 3D hero visualization
   - Mobile app development
   - Offline mode with sync

3. **Infrastructure Scaling**
   - Load balancing for high traffic
   - CDN for hero assets
   - Analytics and monitoring

---

## 10. Implementation Checklist

### 10.1 Pre-Implementation Checklist

- [ ] Review and approve smart contract design
- [ ] Set up Sui testnet development environment
- [ ] Configure wallet testing setup
- [ ] Prepare test data and mock responses
- [ ] Establish testing infrastructure

### 10.2 Implementation Checklist

#### Smart Contract
- [ ] Implement `hero_nft.move` contract
- [ ] Write contract tests
- [ ] Deploy to devnet for testing
- [ ] Verify gas costs and optimization
- [ ] Deploy to testnet
- [ ] Record deployment addresses

#### Frontend Implementation
- [ ] Create TypeScript types (`hero-nft.ts`)
- [ ] Implement service layer (`hero-nft-service.ts`)
- [ ] Create React hooks (`useHeroNFT.ts`)
- [ ] Develop HeroCreation component
- [ ] Develop HeroDisplay component
- [ ] Create CSS styling with retro theme
- [ ] Implement error handling
- [ ] Add accessibility features
- [ ] Optimize for mobile responsiveness

#### Integration
- [ ] Update App.tsx routing logic
- [ ] Integrate with existing authentication
- [ ] Test wallet connection flow
- [ ] Verify NFT ownership detection
- [ ] Test complete user journey

#### Testing
- [ ] Write unit tests for components
- [ ] Write integration tests for service
- [ ] Create E2E tests for user flow
- [ ] Performance testing
- [ ] Cross-browser compatibility testing
- [ ] Mobile device testing

### 10.3 Pre-Demo Checklist

- [ ] Contract deployed and verified
- [ ] All tests passing
- [ ] Demo account funded with SUI
- [ ] Demo flow practiced multiple times
- [ ] Backup video prepared
- [ ] Technical documentation ready
- [ ] Performance metrics collected
- [ ] Error handling verified

---

## Conclusion

This comprehensive story context provides the complete technical foundation for implementing the Hero NFT Smart Contract Integration story. The implementation creates a critical bridge between wallet authentication and active gameplay, establishing permanent player identities through blockchain-verified NFTs.

**Key Success Factors:**
1. **Simplicity:** Minimal contract design focused on core functionality
2. **User Experience:** Seamless, intuitive character creation flow
3. **Performance:** Fast transactions with minimal gas costs
4. **Aesthetics:** Consistent retro gaming visual design
5. **Reliability:** Robust error handling and recovery mechanisms

**Strategic Impact:**
- Enables the core "Provable History" innovation of SuiSaga
- Creates permanent player identity foundation
- Establishes NFT ownership patterns for future features
- Provides impressive demonstration of blockchain integration

The implementation is designed to be both technically impressive for hackathon judges and genuinely useful for players, creating a foundation that can be built upon long after the competition while delivering immediate value and innovation.