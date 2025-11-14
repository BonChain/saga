// Copyright (c) 2025 SuiSaga Team
// SPDX-License-Identifier: MIT

module suisaga::suisaga {
    use sui::object::{Self, UID};
    use sui::transfer::{Self, TransferPolicy};
    use sui::tx_context::{Self, TxContext};
    use std::option::Self;

    /// The main world state that persists across all player actions
    public struct WorldState has key: UID, storage {
        /// The current version of the world state
        version: u64,
        /// Timestamp of last world update
        last_updated: u64,
        /// Village region state
        village: VillageState,
        /// Dragon's lair region state
        lair: LairState,
        /// Forest region state
        forest: ForestState,
        /// Global world properties
        properties: vector<String>,
    }

    /// Village region state
    public struct VillageState has key: UID {
        /// Village prosperity level (0-100)
        prosperity: u8,
        /// Dragon threat level (0-100)
        dragon_threat: u8,
        /// Number of active NPCs
        npc_count: u8,
        /// Village events and history
        events: vector<String>,
    }

    /// Dragon's lair region state
    public struct LairState has key: UID {
        /// Dragon HP (0-1000)
        dragon_hp: u16,
        /// Dragon personality traits
        personality: vector<String>,
        /// Dragon's relationships with players
        player_relationships: vector<String>,
        /// Lair events and history
        events: vector<String>,
    }

    /// Forest region state
    public struct ForestState has key: UID {
        /// Forest danger level (0-100)
        danger_level: u8,
        /// Resource availability
        resources: vector<String>,
        /// Magical phenomena
        phenomena: vector<String>,
        /// Forest events and history
        events: vector<String>,
    }

    /// Represents a player action taken in the world
    public struct PlayerAction has key: UID {
        /// Player who took the action
        player: address,
        /// The action intent/description
        intent: String,
        /// Generated consequences
        consequences: vector<String>,
        /// Butterfly effects triggered
        butterfly_effects: vector<String>,
        /// Blockchain verification
        verification: String,
        /// Action timestamp
        timestamp: u64,
    }

    /// Proof card for verifying player actions on blockchain
    public struct ActionProof has key: UID {
        /// Reference to the player action
        action: UID,
        /// Blockchain verification link
        verification_link: String,
        /// Proof creation timestamp
        created_at: u64,
        /// Proof hash for integrity
        proof_hash: vector<u8>,
    }

    /// Init function to create the initial world state
    public fun init(ctx: &mut TxContext) {
        let world_state = WorldState {
            key: object::new(ctx),
            version: 0,
            last_updated: ctx.epoch_timestamp_ms(),
            village: VillageState {
                key: object::new(ctx),
                prosperity: 50,
                dragon_threat: 75,
                npc_count: 5,
                events: vector[String>[],
            },
            lair: LairState {
                key: object::new(ctx),
                dragon_hp: 1000,
                personality: vector[
                    String::from("fierce"),
                    String::from("territorial"),
                    String::from("ancient")
                ],
                player_relationships: vector<String>[],
                events: vector<String>[],
            },
            forest: ForestState {
                key: object::new(ctx),
                danger_level: 30,
                resources: vector<String>[],
                phenomena: vector<String>[],
                events: vector<String>[],
            },
            properties: vector<String>[
                String::from("SuiSaga Living World"),
                String::from("Version 1.0"),
                String::from("Asynchronous Architecture")
            ],
        };

        transfer::public_transfer(&mut world_state);
        ctx.emit(WorldStateCreated {
            world_id: object::id(&world_state),
            timestamp: ctx.epoch_timestamp_ms(),
            version: 0
        });
    }

    /// Record a new player action in the world
    public fun record_action(
        world_state: &mut WorldState,
        player: address,
        intent: String,
        consequences: vector<String>,
        butterfly_effects: vector<String>,
        ctx: &mut TxContext
    ) {
        let player_action = PlayerAction {
            key: object::new(ctx),
            player,
            intent,
            consequences,
            butterfly_effects,
            verification: String::from("pending_verification"),
            timestamp: ctx.epoch_timestamp_ms(),
        };

        // Update world state version
        world_state.version = world_state.version + 1;
        world_state.last_updated = ctx.epoch_timestamp_ms();

        // Create action proof
        let proof = ActionProof {
            key: object::new(ctx),
            action: object::id(&player_action),
            verification_link: generate_verification_link(ctx, object::id(&player_action)),
            created_at: ctx.epoch_timestamp_ms(),
            proof_hash: generate_proof_hash(&player_action),
        };

        // Emit action recorded event
        ctx.emit(ActionRecorded {
            world_id: object::id(world_state),
            action_id: object::id(&player_action),
            player,
            intent: intent,
            timestamp: ctx.epoch_timestamp_ms(),
        });
    }

    /// Update village state based on world changes
    public fun update_village_state(
        world_state: &mut WorldState,
        prosperity: u8,
        dragon_threat: u8,
        npc_count: u8,
        new_event: String,
        ctx: &mut TxContext
    ) {
        world_state.village.prosperity = prosperity;
        world_state.village.dragon_threat = dragon_threat;
        world_state.village.npc_count = npc_count;
        world_state.village.events.push_back(new_event);

        world_state.version = world_state.version + 1;
        world_state.last_updated = ctx.epoch_timestamp_ms();
    }

    /// Update lair state based on world changes
    public fun update_lair_state(
        world_state: &mut WorldState,
        dragon_hp: u16,
        new_event: String,
        ctx: &mut TxContext
    ) {
        world_state.lair.dragon_hp = dragon_hp;
        world_state.lair.events.push_back(new_event);

        world_state.version = world_state.version + 1;
        world_state.last_updated = ctx.epoch_timestamp_ms();
    }

    /// Update forest state based on world changes
    public fun update_forest_state(
        world_state: &mut WorldState,
        danger_level: u8,
        new_event: String,
        ctx: &mut TxContext
    ) {
        world_state.forest.danger_level = danger_level;
        world_state.forest.events.push_back(new_event);

        world_state.version = world_state.version + 1;
        world_state.last_updated = ctx.epoch_timestamp_ms();
    }

    // ===== Helper Functions =====

    fun generate_verification_link(ctx: &TxContext, action_id: UID): String {
        // In a real implementation, this would generate a proper blockchain verification link
        // For now, return a mock link format
        let action_id_bytes = bcs::to_bytes(&action_id);
        let hex_id = std::string::join(&vector[
            std::string::from_utf8(&action_id_bytes[0..4]),
            std::string::from_utf8(&action_id_bytes[4..8])
        ], &vector[String>["0x"]);

        hex_id
    }

    fun generate_proof_hash(action: &PlayerAction): vector<u8> {
        // Generate a hash of the action for proof integrity
        let action_bytes = bcs::to_bytes(action);
        let mut hasher = std::hash::sha2::Sha256::default();
        hasher.update(&action_bytes);
        hasher.final()
    }

    // ===== Events =====

    public struct WorldStateCreated has drop {
        world_id: UID,
        timestamp: u64,
        version: u64,
    }

    public struct ActionRecorded has drop {
        world_id: UID,
        action_id: UID,
        player: address,
        intent: String,
        timestamp: u64,
    }
}