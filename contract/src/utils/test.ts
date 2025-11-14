/**
 * SuiSaga Smart Contract Testing Utilities
 */

import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypair/ed25519';
import { Transaction } from '@mysten/sui/transactions';

export interface TestConfig {
    network: 'testnet' | 'mainnet' | 'localnet';
    packageId: string;
    worldStateId: string;
}

export interface TestResult {
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
    details?: any;
}

export class SuiSagaTester {
    private client: SuiClient;
    private keypair: Ed25519Keypair;
    private config: TestConfig;

    constructor(config: TestConfig) {
        const networkUrl = config.network === 'mainnet'
            ? 'https://fullnode.mainnet.sui.io:443'
            : config.network === 'testnet'
            ? 'https://fullnode.testnet.sui.io:443'
            : 'http://localhost:9000';

        this.client = new SuiClient({ url: networkUrl });
        this.keypair = Ed25519Keypair.generate();
        this.config = config;
    }

    /**
     * Run all tests
     */
    async runAllTests(): Promise<TestResult[]> {
        const tests = [
            this.testWorldStateExists,
            this.testRecordPlayerAction,
            this.testUpdateVillageState,
            this.testUpdateLairState,
            this.testUpdateForestState,
            this.testBlockchainVerification
        ];

        const results: TestResult[] = [];

        for (const test of tests) {
            const result = await this.runTest(test.name, () => test.call(this));
            results.push(result);
            console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.duration}ms`);
            if (!result.passed && result.error) {
                console.log(`   Error: ${result.error}`);
            }
        }

        const passed = results.filter(r => r.passed).length;
        const total = results.length;

        console.log(`\n📊 Test Results: ${passed}/${total} passed`);

        return results;
    }

    private async runTest(testName: string, testFn: () => Promise<void>): Promise<TestResult> {
        const startTime = Date.now();

        try {
            await testFn();
            return {
                testName,
                passed: true,
                duration: Date.now() - startTime
            };
        } catch (error) {
            return {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Test that world state exists and is accessible
     */
    private async testWorldStateExists(): Promise<void> {
        const object = await this.client.getObject({
            id: this.config.worldStateId,
            options: { showContent: true }
        });

        if (!object.data?.content) {
            throw new Error('World state object not found or has no content');
        }

        // Verify structure
        const content = object.data.content as any;
        if (!content.fields.version || !content.fields.village || !content.fields.lair || !content.fields.forest) {
            throw new Error('World state structure is invalid');
        }
    }

    /**
     * Test recording a player action
     */
    private async testRecordPlayerAction(): Promise<void> {
        const tx = new Transaction();
        tx.setGasBudget(1000000);

        tx.moveCall({
            target: `${this.config.packageId}::suisaga::record_action`,
            arguments: [
                tx.object(this.config.worldStateId),
                tx.pure.address(this.keypair.toSuiAddress()),
                tx.pure.string('Test action: explore the forest'),
                tx.pure.vector('String', ['discovered hidden path', 'found mysterious artifact']),
                tx.pure.vector('String', ['forest magic awakened'])
            ]
        });

        const result = await this.client.signAndExecuteTransaction({
            signer: this.keypair,
            transaction: tx,
            options: { showEffects: true, showEvents: true }
        });

        if (!result.effects?.success) {
            throw new Error('Failed to record player action');
        }

        // Verify events were emitted
        const actionRecordedEvent = result.events?.find(e =>
            e.type === `${this.config.packageId}::suisaga::ActionRecorded`
        );

        if (!actionRecordedEvent) {
            throw new Error('ActionRecorded event not found');
        }
    }

    /**
     * Test updating village state
     */
    private async testUpdateVillageState(): Promise<void> {
        const tx = new Transaction();
        tx.setGasBudget(1000000);

        tx.moveCall({
            target: `${this.config.packageId}::suisaga::update_village_state`,
            arguments: [
                tx.object(this.config.worldStateId),
                tx.pure.u8(60), // prosperity
                tx.pure.u8(70), // dragon_threat
                tx.pure.u8(6),  // npc_count
                tx.pure.string('Test event: village festival')
            ]
        });

        const result = await this.client.signAndExecuteTransaction({
            signer: this.keypair,
            transaction: tx,
            options: { showEffects: true, showEvents: true }
        });

        if (!result.effects?.success) {
            throw new Error('Failed to update village state');
        }
    }

    /**
     * Test updating lair state
     */
    private async testUpdateLairState(): Promise<void> {
        const tx = new Transaction();
        tx.setGasBudget(1000000);

        tx.moveCall({
            target: `${this.config.packageId}::suisaga::update_lair_state`,
            arguments: [
                tx.object(this.config.worldStateId),
                tx.pure.u16(900), // dragon_hp
                tx.pure.string('Test event: dragon wounded in battle')
            ]
        });

        const result = await this.client.signAndExecuteTransaction({
            signer: this.keypair,
            transaction: tx,
            options: { showEffects: true, showEvents: true }
        });

        if (!result.effects?.success) {
            throw new Error('Failed to update lair state');
        }
    }

    /**
     * Test updating forest state
     */
    private async testUpdateForestState(): Promise<void> {
        const tx = new Transaction();
        tx.setGasBudget(1000000);

        tx.moveCall({
            target: `${this.config.packageId}::suisaga::update_forest_state`,
            arguments: [
                tx.object(this.config.worldStateId),
                tx.pure.u8(40), // danger_level
                tx.pure.string('Test event: forest spirit appeared')
            ]
        });

        const result = await this.client.signAndExecuteTransaction({
            signer: this.keypair,
            transaction: tx,
            options: { showEffects: true, showEvents: true }
        });

        if (!result.effects?.success) {
            throw new Error('Failed to update forest state');
        }
    }

    /**
     * Test blockchain verification of transactions
     */
    private async testBlockchainVerification(): Promise<void> {
        // Get a recent transaction and verify it exists on blockchain
        const txs = await this.client.queryTransactionBlocks({
            filter: {
                Address: this.keypair.toSuiAddress()
            },
            limit: 1,
            order: 'descending'
        });

        if (txs.data.length === 0) {
            throw new Error('No transactions found for verification');
        }

        const latestTx = txs.data[0];
        if (!latestTx.digest) {
            throw new Error('Transaction digest missing');
        }

        // Verify transaction details
        const txDetails = await this.client.getTransactionBlock({
            digest: latestTx.digest
        });

        if (!txDetails) {
            throw new Error('Cannot retrieve transaction details');
        }
    }
}

export default SuiSagaTester;