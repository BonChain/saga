/**
 * SuiSaga Smart Contract Interface
 *
 * TypeScript utilities for interacting with SuiSaga Move smart contracts
 * and Sui blockchain integration for the living world game.
 */

import { SuiClient, SuiObjectResponse, SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypair/ed25519';
import { Transaction } from '@mysten/sui/transactions';

export interface WorldState {
    version: number;
    lastUpdated: number;
    village: VillageState;
    lair: LairState;
    forest: ForestState;
    properties: string[];
}

export interface VillageState {
    prosperity: number;
    dragonThreat: number;
    npcCount: number;
    events: string[];
}

export interface LairState {
    dragonHp: number;
    personality: string[];
    playerRelationships: string[];
    events: string[];
}

export interface ForestState {
    dangerLevel: number;
    resources: string[];
    phenomena: string[];
    events: string[];
}

export interface PlayerAction {
    id: string;
    player: string;
    intent: string;
    consequences: string[];
    butterflyEffects: string[];
    verification: string;
    timestamp: number;
}

export interface ActionProof {
    action: string;
    verificationLink: string;
    createdAt: number;
    proofHash: string[];
}

export class SuiSagaContract {
    private client: SuiClient;
    private keypair: Ed25519Keypair;
    private packageId: string;
    private worldStateId: string;

    constructor(config: {
        network: 'testnet' | 'mainnet' | 'localnet';
        packageId: string;
        worldStateId: string;
        keypair?: Ed25519Keypair;
    }) {
        const networkUrl = config.network === 'mainnet'
            ? 'https://fullnode.mainnet.sui.io:443'
            : config.network === 'testnet'
            ? 'https://fullnode.testnet.sui.io:443'
            : 'http://localhost:9000';

        this.client = new SuiClient({ url: networkUrl });
        this.keypair = config.keypair || Ed25519Keypair.generate();
        this.packageId = config.packageId;
        this.worldStateId = config.worldStateId;
    }

    /**
     * Get current world state from blockchain
     */
    async getWorldState(): Promise<WorldState> {
        const object = await this.client.getObject({
            id: this.worldStateId,
            options: { showContent: true }
        });

        if (!object.data?.content) {
            throw new Error('World state not found or not accessible');
        }

        // Parse Move object data (simplified for this example)
        const content = object.data.content as any;

        return {
            version: content.fields.version,
            lastUpdated: content.fields.last_updated,
            village: {
                prosperity: content.fields.village.fields.prosperity,
                dragonThreat: content.fields.village.fields.dragon_threat,
                npcCount: content.fields.village.fields.npc_count,
                events: content.fields.village.fields.events
            },
            lair: {
                dragonHp: content.fields.lair.fields.dragon_hp,
                personality: content.fields.lair.fields.personality,
                playerRelationships: content.fields.lair.fields.player_relationships,
                events: content.fields.lair.fields.events
            },
            forest: {
                dangerLevel: content.fields.forest.fields.danger_level,
                resources: content.fields.forest.fields.resources,
                phenomena: content.fields.forest.fields.phenomena,
                events: content.fields.forest.fields.events
            },
            properties: content.fields.properties
        };
    }

    /**
     * Record a new player action on the blockchain
     */
    async recordPlayerAction(
        intent: string,
        consequences: string[],
        butterflyEffects: string[]
    ): Promise<SuiTransactionBlockResponse> {
        const tx = new Transaction();

        // Add move call to record action
        tx.moveCall({
            target: `${this.packageId}::suisaga::record_action`,
            arguments: [
                tx.object(this.worldStateId),
                tx.pure.address(this.keypair.toSuiAddress()),
                tx.pure.string(intent),
                tx.pure.vector('String', consequences),
                tx.pure.vector('String', butterflyEffects)
            ]
        });

        const result = await this.client.signAndExecuteTransaction({
            signer: this.keypair,
            transaction: tx,
            options: { showEffects: true, showEvents: true }
        });

        return result;
    }

    /**
     * Update village state based on player actions
     */
    async updateVillageState(
        prosperity: number,
        dragonThreat: number,
        npcCount: number,
        newEvent: string
    ): Promise<SuiTransactionBlockResponse> {
        const tx = new Transaction();

        tx.moveCall({
            target: `${this.packageId}::suisaga::update_village_state`,
            arguments: [
                tx.object(this.worldStateId),
                tx.pure.u8(prosperity),
                tx.pure.u8(dragonThreat),
                tx.pure.u8(npcCount),
                tx.pure.string(newEvent)
            ]
        });

        return await this.client.signAndExecuteTransaction({
            signer: this.keypair,
            transaction: tx,
            options: { showEffects: true, showEvents: true }
        });
    }

    /**
     * Update lair state based on player actions
     */
    async updateLairState(
        dragonHp: number,
        newEvent: string
    ): Promise<SuiTransactionBlockResponse> {
        const tx = new Transaction();

        tx.moveCall({
            target: `${this.packageId}::suisaga::update_lair_state`,
            arguments: [
                tx.object(this.worldStateId),
                tx.pure.u16(dragonHp),
                tx.pure.string(newEvent)
            ]
        });

        return await this.client.signAndExecuteTransaction({
            signer: this.keypair,
            transaction: tx,
            options: { showEffects: true, showEvents: true }
        });
    }

    /**
     * Update forest state based on player actions
     */
    async updateForestState(
        dangerLevel: number,
        newEvent: string
    ): Promise<SuiTransactionBlockResponse> {
        const tx = new Transaction();

        tx.moveCall({
            target: `${this.packageId}::suisaga::update_forest_state`,
            arguments: [
                tx.object(this.worldStateId),
                tx.pure.u8(dangerLevel),
                tx.pure.string(newEvent)
            ]
        });

        return await this.client.signAndExecuteTransaction({
            signer: this.keypair,
            transaction: tx,
            options: { showEffects: true, showEvents: true }
        });
    }

    /**
     * Get player's address
     */
    getPlayerAddress(): string {
        return this.keypair.toSuiAddress();
    }

    /**
     * Generate verification link for action
     */
    generateVerificationLink(actionId: string): string {
        return `https://suiexplorer.com/tx/${actionId}`;
    }
}

export default SuiSagaContract;