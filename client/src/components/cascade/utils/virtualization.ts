/**
 * Large Dataset Virtualization for Cascade Visualization
 * Implements Level of Detail (LOD) and viewport culling for performance
 */

import type { CascadeNode, CascadeConnection } from '../types/cascade';

export interface VirtualizationConfig {
  maxNodes: number;
  viewportBuffer: number;
  clusteringThreshold: number;
  lodLevels: number[];
  enableCulling: boolean;
  enableClustering: boolean;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface VirtualizationResult {
  visibleNodes: CascadeNode[];
  visibleConnections: CascadeConnection[];
  nodeMap: Map<string, CascadeNode>;
  isVirtualized: boolean;
  lodLevel: number;
  totalNodes: number;
  visibleNodeCount: number;
  culledNodeCount: number;
  clusteredNodeCount: number;
}

/**
 * Default virtualization configuration
 */
const DEFAULT_CONFIG: VirtualizationConfig = {
  maxNodes: 500,
  viewportBuffer: 100,
  clusteringThreshold: 0.5, // Zoom level threshold
  lodLevels: [0.25, 0.5, 0.75, 1.0],
  enableCulling: true,
  enableClustering: true
};

/**
 * Level of Detail thresholds
 */
const LOD_THRESHOLDS = [
  { zoom: 0.25, nodeLimit: 50, detailLevel: 'very-low' },
  { zoom: 0.5, nodeLimit: 150, detailLevel: 'low' },
  { zoom: 0.75, nodeLimit: 300, detailLevel: 'medium' },
  { zoom: 1.0, nodeLimit: 500, detailLevel: 'high' },
  { zoom: 2.0, nodeLimit: 1000, detailLevel: 'very-high' }
];

/**
 * Cascade Virtualization Manager
 */
export class CascadeVirtualization {
  private config: VirtualizationConfig;
  private nodeCache: Map<string, CascadeNode> = new Map();
  private lastViewport: Viewport | null = null;

  constructor(config: Partial<VirtualizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process nodes and connections for virtualization
   */
  public virtualize(
    nodes: CascadeNode[],
    connections: CascadeConnection[],
    viewport: Viewport
  ): VirtualizationResult {
    // Check if virtualization is needed
    const needsVirtualization = nodes.length > this.config.maxNodes;

    if (!needsVirtualization) {
      return this.createNonVirtualizedResult(nodes, connections);
    }

    // Determine Level of Detail
    const lodLevel = this.determineLOD(viewport.zoom);
    const lodThreshold = LOD_THRESHOLDS[lodLevel];

    // Start performance monitoring
    const startTime = performance.now();

    let processedNodes: CascadeNode[] = [...nodes];
    let processedConnections = [...connections];
    let culledCount = 0;
    let clusteredCount = 0;

    // Apply viewport culling if enabled
    if (this.config.enableCulling) {
      const cullingResult = this.applyViewportCulling(processedNodes, viewport);
      processedNodes = cullingResult.nodes;
      culledCount = cullingResult.culledCount;
    }

    // Apply clustering if enabled and zoom level is low
    if (this.config.enableClustering && viewport.zoom < this.config.clusteringThreshold) {
      const clusteringResult = this.applyClustering(processedNodes, lodThreshold.nodeLimit);
      processedNodes = clusteringResult.nodes;
      processedConnections = clusteringResult.connections;
      clusteredCount = clusteringResult.clusteredCount;
    }

    // Apply level of detail optimizations
    if (processedNodes.length > lodThreshold.nodeLimit) {
      const lodResult = this.applyLevelOfDetail(processedNodes, lodThreshold);
      processedNodes = lodResult.nodes;
      processedConnections = lodResult.connections;
    }

    // Create node map for efficient lookup
    const nodeMap = new Map<string, CascadeNode>();
    processedNodes.forEach(node => {
      nodeMap.set(node.id, node);
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    if (import.meta.env.DEV) {
      console.log(`🚀 Virtualization: ${nodes.length} → ${processedNodes.length} nodes in ${processingTime.toFixed(2)}ms`);
      console.log(`  - Culled: ${culledCount}, Clustered: ${clusteredCount}`);
      console.log(`  - LOD Level: ${lodLevel} (${lodThreshold.detailLevel})`);
    }

    return {
      visibleNodes: processedNodes,
      visibleConnections: processedConnections,
      nodeMap,
      isVirtualized: true,
      lodLevel,
      totalNodes: nodes.length,
      visibleNodeCount: processedNodes.length,
      culledNodeCount: culledCount,
      clusteredNodeCount: clusteredCount
    };
  }

  /**
   * Determine Level of Detail based on zoom level
   */
  private determineLOD(zoom: number): number {
    for (let i = LOD_THRESHOLDS.length - 1; i >= 0; i--) {
      if (zoom >= LOD_THRESHOLDS[i].zoom) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Apply viewport culling to hide nodes outside visible area
   */
  private applyViewportCulling(
    nodes: CascadeNode[],
    viewport: Viewport
  ): { nodes: CascadeNode[]; culledCount: number } {
    const buffer = this.config.viewportBuffer;
    const minX = viewport.x - buffer;
    const maxX = viewport.x + viewport.width + buffer;
    const minY = viewport.y - buffer;
    const maxY = viewport.y + viewport.height + buffer;

    const visibleNodes = nodes.filter(node => {
      const x = node.x || 0;
      const y = node.y || 0;

      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    });

    return {
      nodes: visibleNodes,
      culledCount: nodes.length - visibleNodes.length
    };
  }

  /**
   * Apply clustering to group nearby nodes
   */
  private applyClustering(
    nodes: CascadeNode[],
    targetCount: number
  ): { nodes: CascadeNode[]; connections: CascadeConnection[]; clusteredCount: number } {
    if (nodes.length <= targetCount) {
      return { nodes, connections: [], clusteredCount: 0 };
    }

    // Simple clustering algorithm based on system and proximity
    const systemClusters = new Map<string, CascadeNode[]>();

    // Group by system first
    nodes.forEach(node => {
      if (!systemClusters.has(node.system)) {
        systemClusters.set(node.system, []);
      }
      systemClusters.get(node.system)!.push(node);
    });

    const clusteredNodes: CascadeNode[] = [];
    const clusteredConnections: CascadeConnection[] = [];
    let clusteredCount = 0;

    // Process each system cluster
    for (const [system, systemNodes] of systemClusters.entries()) {
      if (systemNodes.length <= 10) {
        // Small clusters, keep as individual nodes
        clusteredNodes.push(...systemNodes);
      } else {
        // Large clusters, create super clusters
        const clusters = this.createSpatialClusters(systemNodes, Math.ceil(targetCount / systemClusters.size));

        clusters.forEach(cluster => {
          if (cluster.length === 1) {
            clusteredNodes.push(cluster[0]);
          } else {
            const clusterNode = this.createClusterNode(cluster, system);
            clusteredNodes.push(clusterNode);
            clusteredCount += cluster.length - 1;
          }
        });
      }
    }

    return {
      nodes: clusteredNodes,
      connections: clusteredConnections,
      clusteredCount
    };
  }

  /**
   * Create spatial clusters within a system
   */
  private createSpatialClusters(nodes: CascadeNode[], maxClusters: number): CascadeNode[][] {
    if (nodes.length <= maxClusters) {
      return nodes.map(node => [node]);
    }

    // Simple k-means-like clustering
    const clusters: CascadeNode[][] = [];
    const used = new Set<string>();

    // Select cluster centers
    const centers = this.selectClusterCenters(nodes, maxClusters);

    centers.forEach(center => {
      const cluster = [center];
      used.add(center.id);

      // Find nearby nodes
      nodes.forEach(node => {
        if (!used.has(node.id)) {
          const distance = this.calculateDistance(center, node);
          if (distance < 200) { // 200px clustering radius
            cluster.push(node);
            used.add(node.id);
          }
        }
      });

      clusters.push(cluster);
    });

    // Add remaining nodes to nearest clusters
    nodes.forEach(node => {
      if (!used.has(node.id)) {
        let nearestCluster = clusters[0];
        let minDistance = Infinity;

        clusters.forEach(cluster => {
          const centerNode = cluster[0];
          const distance = this.calculateDistance(centerNode, node);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = cluster;
          }
        });

        nearestCluster.push(node);
        used.add(node.id);
      }
    });

    return clusters;
  }

  /**
   * Select cluster centers using spread algorithm
   */
  private selectClusterCenters(nodes: CascadeNode[], count: number): CascadeNode[] {
    if (nodes.length <= count) {
      return nodes;
    }

    const centers: CascadeNode[] = [];
    const available = [...nodes];

    // Select first center randomly
    centers.push(available.splice(Math.floor(Math.random() * available.length), 1)[0]);

    // Select remaining centers to maximize distance
    while (centers.length < count && available.length > 0) {
      let bestNode = available[0];
      let maxMinDistance = 0;

      available.forEach(node => {
        let minDistance = Infinity;
        centers.forEach(center => {
          const distance = this.calculateDistance(center, node);
          minDistance = Math.min(minDistance, distance);
        });

        if (minDistance > maxMinDistance) {
          maxMinDistance = minDistance;
          bestNode = node;
        }
      });

      centers.push(bestNode);
      const index = available.indexOf(bestNode);
      available.splice(index, 1);
    }

    return centers;
  }

  /**
   * Create a cluster node from multiple nodes
   */
  private createClusterNode(nodes: CascadeNode[], system: string): CascadeNode {
    const clusterId = `cluster-${system}-${nodes.map(n => n.id).join('-')}`;

    // Check cache first
    if (this.nodeCache.has(clusterId)) {
      return this.nodeCache.get(clusterId)!;
    }

    const totalImpact = nodes.reduce((sum, node) => sum + node.impact, 0);
    const avgImpact = totalImpact / nodes.length;

    // Calculate center position
    const validNodes = nodes.filter(node => node.x !== undefined && node.y !== undefined);
    const centerX = validNodes.length > 0 ?
      validNodes.reduce((sum, node) => sum + (node.x || 0), 0) / validNodes.length : 0;
    const centerY = validNodes.length > 0 ?
      validNodes.reduce((sum, node) => sum + (node.y || 0), 0) / validNodes.length : 0;

    const clusterNode: CascadeNode = {
      id: clusterId,
      type: 'cluster',
      label: `${system} (${nodes.length})`,
      system,
      impact: avgImpact,
      x: centerX,
      y: centerY,
      nodeIds: nodes.map(n => n.id),
      nodeCount: nodes.length,
      color: this.getSystemColor(system),
      delay: 0,
      duration: 1
    };

    // Cache the cluster node
    this.nodeCache.set(clusterId, clusterNode);

    return clusterNode;
  }

  /**
   * Apply Level of Detail optimizations
   */
  private applyLevelOfDetail(
    nodes: CascadeNode[],
    lodThreshold: typeof LOD_THRESHOLDS[0]
  ): { nodes: CascadeNode[]; connections: CascadeConnection[] } {
    if (nodes.length <= lodThreshold.nodeLimit) {
      return { nodes, connections: [] };
    }

    // Sort by impact and keep the most important nodes
    const sortedNodes = [...nodes].sort((a, b) => b.impact - a.impact);
    const limitedNodes = sortedNodes.slice(0, lodThreshold.nodeLimit);

    return {
      nodes: limitedNodes,
      connections: [] // Simplified connections for LOD
    };
  }

  /**
   * Calculate distance between two nodes
   */
  private calculateDistance(node1: CascadeNode, node2: CascadeNode): number {
    const x1 = node1.x || 0;
    const y1 = node1.y || 0;
    const x2 = node2.x || 0;
    const y2 = node2.y || 0;

    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Get system color for clusters
   */
  private getSystemColor(system: string): string {
    const systemColors: Record<string, string> = {
      combat: '#ff6b6b',
      social: '#4ecdc4',
      environment: '#45b7d1',
      economic: '#f9ca24'
    };
    return systemColors[system] || '#95afc0';
  }

  /**
   * Create result for non-virtualized data
   */
  private createNonVirtualizedResult(
    nodes: CascadeNode[],
    connections: CascadeConnection[]
  ): VirtualizationResult {
    const nodeMap = new Map<string, CascadeNode>();
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });

    return {
      visibleNodes: nodes,
      visibleConnections: connections,
      nodeMap,
      isVirtualized: false,
      lodLevel: 4, // Maximum detail
      totalNodes: nodes.length,
      visibleNodeCount: nodes.length,
      culledNodeCount: 0,
      clusteredNodeCount: 0
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<VirtualizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.nodeCache.clear(); // Clear cache when config changes
  }

  /**
   * Clear cached data
   */
  public clearCache(): void {
    this.nodeCache.clear();
    this.lastViewport = null;
  }

  /**
   * Get virtualization statistics
   */
  public getStats() {
    return {
      config: this.config,
      cacheSize: this.nodeCache.size,
      lastViewport: this.lastViewport
    };
  }
}

// Global virtualization instance
export const cascadeVirtualization = new CascadeVirtualization();

/**
 * Hook for using virtualization in React components
 */
export const useCascadeVirtualization = (config?: Partial<VirtualizationConfig>) => {
  const virtualizer = config ?
    new CascadeVirtualization(config) :
    cascadeVirtualization;

  return {
    virtualize: (nodes: CascadeNode[], connections: CascadeConnection[], viewport: Viewport) =>
      virtualizer.virtualize(nodes, connections, viewport),
    updateConfig: (newConfig: Partial<VirtualizationConfig>) => virtualizer.updateConfig(newConfig),
    clearCache: () => virtualizer.clearCache(),
    getStats: () => virtualizer.getStats()
  };
};