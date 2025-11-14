/**
 * SuiSaga Smart Contract Interface
 *
 * Main export for SuiSaga Move smart contract interactions
 * and blockchain integration utilities.
 */

export { SuiSagaContract } from './sui-contract';
export type {
    WorldState,
    VillageState,
    LairState,
    ForestState,
    PlayerAction,
    ActionProof
} from './sui-contract';

export * from './utils/deploy';
export * from './utils/test';