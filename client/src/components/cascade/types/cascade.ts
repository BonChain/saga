/**
 * TypeScript interfaces for Cascade Visualization Engine
 * Story 8.2 - Cascade Visualization Engine
 *
 * These interfaces define the data structures for visualizing action consequences
 * and butterfly effects in the living world system.
 */

export interface CascadeData {
  actionId: string;
  nodes: CascadeNode[];
  connections: CascadeConnection[];
  metadata: CascadeMetadata;
  timestamp: string;
  playerId: string;
}

export interface CascadeNode {
  id: string;
  type: 'action' | 'consequence' | 'butterfly-effect';
  label: string;
  system: string;
  description?: string;
  impact: number; // 1-10 scale
  x?: number;
  y?: number;
  radius?: number;
  color?: string;
  delay?: number; // seconds from action start
  duration?: number; // animation duration
}

export interface CascadeConnection {
  source: string;
  target: string;
  type: 'direct' | 'cascading';
  strength: number; // 0.1-1.0
  delay?: number; // seconds
  duration?: number; // animation duration
  description?: string;
}

export interface CascadeMetadata {
  totalNodes: number;
  totalConnections: number;
  processingTime: number; // seconds
  worldSystemsAffected: string[];
  maxDepth: number; // levels of cascading effects
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CascadeVisualizationProps {
  data: CascadeData | null;
  isLoading?: boolean;
  error?: string | null;
  width?: number;
  height?: number;
  onNodeClick?: (node: CascadeNode) => void;
  onNodeHover?: (node: CascadeNode | null) => void;
  className?: string;
}

export interface WorldSystemColors {
  [system: string]: {
    primary: string;
    secondary: string;
    glow: string;
  };
}

// World system color mapping for retro styling
export const DEFAULT_WORLD_SYSTEM_COLORS: WorldSystemColors = {
  'environment': {
    primary: '#00ff41', // neon green
    secondary: '#00cc33',
    glow: 'rgba(0, 255, 65, 0.3)'
  },
  'character': {
    primary: '#00ffff', // neon cyan
    secondary: '#00cccc',
    glow: 'rgba(0, 255, 255, 0.3)'
  },
  'economic': {
    primary: '#ff99ff', // neon pink
    secondary: '#cc66cc',
    glow: 'rgba(255, 153, 255, 0.3)'
  },
  'combat': {
    primary: '#ff4444', // neon red
    secondary: '#cc0000',
    glow: 'rgba(255, 68, 68, 0.3)'
  },
  'social': {
    primary: '#ffaa00', // neon orange
    secondary: '#cc8800',
    glow: 'rgba(255, 170, 0, 0.3)'
  },
  'magic': {
    primary: '#9944ff', // neon purple
    secondary: '#7733cc',
    glow: 'rgba(153, 68, 255, 0.3)'
  }
};

// Default cascade data for testing/demo purposes
export const DEFAULT_CASCADE_DATA: CascadeData = {
  actionId: 'demo-action-001',
  nodes: [
    {
      id: 'action-001',
      type: 'action',
      label: 'Attack dragon with sword',
      system: 'combat',
      description: 'Player initiated combat action',
      impact: 8,
      delay: 0,
      duration: 1
    },
    {
      id: 'consequence-001',
      type: 'consequence',
      label: 'Dragon retaliates with fire',
      system: 'combat',
      description: 'Direct combat response',
      impact: 7,
      delay: 1,
      duration: 2
    },
    {
      id: 'butterfly-001',
      type: 'butterfly-effect',
      label: 'Villagers panic and flee',
      system: 'social',
      description: 'Social chaos from dragon fight',
      impact: 5,
      delay: 2.5,
      duration: 3
    },
    {
      id: 'butterfly-002',
      type: 'butterfly-effect',
      label: 'Forest caught in wildfire',
      system: 'environment',
      description: 'Environmental damage from dragon fire',
      impact: 9,
      delay: 4,
      duration: 5
    }
  ],
  connections: [
    {
      source: 'action-001',
      target: 'consequence-001',
      type: 'direct',
      strength: 0.9,
      delay: 1,
      description: 'Direct combat response'
    },
    {
      source: 'consequence-001',
      target: 'butterfly-001',
      type: 'cascading',
      strength: 0.6,
      delay: 1.5,
      description: 'Social chaos spreads'
    },
    {
      source: 'consequence-001',
      target: 'butterfly-002',
      type: 'cascading',
      strength: 0.8,
      delay: 2,
      description: 'Fire spreads to environment'
    }
  ],
  metadata: {
    totalNodes: 4,
    totalConnections: 3,
    processingTime: 8.5,
    worldSystemsAffected: ['combat', 'social', 'environment'],
    maxDepth: 2,
    severity: 'high'
  },
  timestamp: new Date().toISOString(),
  playerId: 'player-001'
};