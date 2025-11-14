/**
 * SuiSaga Smart Contract Deployment Utilities
 */

import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypair/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

export interface DeploymentConfig {
    network: 'testnet' | 'mainnet' | 'localnet';
    gasBudget?: number;
    keypair?: Ed25519Keypair;
}

export interface DeploymentResult {
    packageId: string;
    worldStateId: string;
    version: string;
    digest: string;
    deployedAt: number;
}

export class SuiSagaDeployer {
    private client: SuiClient;
    private keypair: Ed25519Keypair;

    constructor(config: {
        network: 'testnet' | 'mainnet' | 'localnet';
        keypair?: Ed25519Keypair;
    }) {
        const networkUrl = config.network === 'mainnet'
            ? 'https://fullnode.mainnet.sui.io:443'
            : config.network === 'testnet'
            ? 'https://fullnode.testnet.sui.io:443'
            : 'http://localhost:9000';

        this.client = new SuiClient({ url: networkUrl });
        this.keypair = config.keypair || Ed25519Keypair.generate();
    }

    /**
     * Build the Move package
     */
    build(): void {
        try {
            execSync('sui move build', { cwd: process.cwd(), stdio: 'inherit' });
            console.log('✅ Move package built successfully');
        } catch (error) {
            console.error('❌ Failed to build Move package:', error);
            throw error;
        }
    }

    /**
     * Deploy the SuiSaga smart contract package
     */
    async deploy(config: DeploymentConfig = {}): Promise<DeploymentResult> {
        const { network = 'testnet', gasBudget = 1000000000 } = config;

        try {
            // First, ensure the package is built
            this.build();

            // Read the compiled package bytes
            const packageBytes = readFileSync('./build/suisaga/bytecode_modules.suipkg');

            // Create transaction for deployment
            const tx = new Transaction();

            // Set gas budget
            tx.setGasBudget(gasBudget);

            // Publish the package
            const upgradeCap = tx.publish({
                modules: [
                    { name: 'suisaga', bytes: packageBytes }
                ],
                dependencies: []
            });

            // Execute the transaction
            const result = await this.client.signAndExecuteTransaction({
                signer: this.keypair,
                transaction: tx,
                options: { showEffects: true, showEvents: true }
            });

            if (!result.effects?.success) {
                throw new Error('Contract deployment failed');
            }

            const packageId = result.effects.created?.[0]?.reference?.objectId;
            if (!packageId) {
                throw new Error('Package ID not found in deployment result');
            }

            // Initialize the world state
            const worldStateResult = await this.initializeWorldState(packageId, gasBudget);
            const worldStateId = worldStateResult.effects.created?.[0]?.reference?.objectId;

            if (!worldStateId) {
                throw new Error('World state ID not found in initialization result');
            }

            const deploymentResult: DeploymentResult = {
                packageId,
                worldStateId: worldStateId!,
                version: '1.0.0',
                digest: result.digest,
                deployedAt: Date.now()
            };

            console.log('✅ SuiSaga contract deployed successfully!');
            console.log(`📦 Package ID: ${packageId}`);
            console.log(`🌍 World State ID: ${worldStateId}`);
            console.log(`🔗 Explorer: https://suiexplorer.com/object/${packageId}?network=${network}`);

            return deploymentResult;

        } catch (error) {
            console.error('❌ Deployment failed:', error);
            throw error;
        }
    }

    /**
     * Initialize world state after deployment
     */
    private async initializeWorldState(packageId: string, gasBudget: number) {
        const tx = new Transaction();
        tx.setGasBudget(gasBudget);

        // Call the init function
        tx.moveCall({
            target: `${packageId}::suisaga::init`,
            arguments: []
        });

        return await this.client.signAndExecuteTransaction({
            signer: this.keypair,
            transaction: tx,
            options: { showEffects: true, showEvents: true }
        });
    }

    /**
     * Upgrade the deployed contract
     */
    async upgrade(packageId: string, gasBudget = 1000000000): Promise<string> {
        try {
            this.build();

            const tx = new Transaction();
            tx.setGasBudget(gasBudget);

            const packageBytes = readFileSync('./build/suisaga/bytecode_modules.suipkg');

            tx.upgrade({
                packageId,
                ticketId: 'upgrade-ticket-id', // This would need to be fetched from the current state
                modules: [
                    { name: 'suisaga', bytes: packageBytes }
                ],
                dependencies: []
            });

            const result = await this.client.signAndExecuteTransaction({
                signer: this.keypair,
                transaction: tx,
                options: { showEffects: true, showEvents: true }
            });

            if (!result.effects?.success) {
                throw new Error('Contract upgrade failed');
            }

            console.log('✅ Contract upgraded successfully!');
            return result.digest;

        } catch (error) {
            console.error('❌ Upgrade failed:', error);
            throw error;
        }
    }

    /**
     * Get deployment info from the Move.toml file
     */
    getDeploymentInfo(): { name: string; version: string } {
        const moveToml = readFileSync('./Move.toml', 'utf8');
        const nameMatch = moveToml.match(/name = "([^"]+)"/);
        const versionMatch = moveToml.match(/version = "([^"]+)"/);

        return {
            name: nameMatch?.[1] || 'unknown',
            version: versionMatch?.[1] || 'unknown'
        };
    }
}

export default SuiSagaDeployer;