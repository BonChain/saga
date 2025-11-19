import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import * as d3 from 'd3'
import type { CascadeNode, CascadeConnection, CascadeVisualizationProps } from './types/cascade'

// D3 simulation types - these represent the transformed data during simulation
type SimulatedNode = CascadeNode & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

type SimulatedLink = {
  source: SimulatedNode | string;
  target: SimulatedNode | string;
  index?: number;
  x?: number;
  y?: number;
} & CascadeConnection;
import { DEFAULT_CASCADE_DATA, DEFAULT_WORLD_SYSTEM_COLORS } from './types/cascade'
import {
  memoizeForceConfig,
  memoizeCollisionDetection,
  getMemoCacheStats
} from './utils/memoization'
import { performanceMonitor } from './utils/performance-monitor'
import PerformanceWarnings from './PerformanceWarnings'
import './styles/cascade.css'

/**
 * CascadeVisualization Component
 * Interactive D3.js force-directed graph for visualizing action consequences
 * and butterfly effects in the living world system.
 */
const CascadeVisualization: React.FC<CascadeVisualizationProps> = ({
  data,
  isLoading = false,
  error = null,
  width = 800,
  height = 600,
  onNodeClick,
  onNodeHover,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<CascadeNode, CascadeConnection> | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [dimensions, setDimensions] = useState({ width, height })
  const [hoveredNode, setHoveredNode] = useState<CascadeNode | null>(null)

  // Handle responsive dimensions
  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentElement
      if (container) {
        const { clientWidth } = container
        const newWidth = Math.min(clientWidth, width)
        const newHeight = Math.min(newWidth * 0.75, height)
        setDimensions({ width: newWidth, height: newHeight })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [width, height])

  // Get node color based on world system
  const getNodeColor = useCallback((node: CascadeNode): string => {
    const systemColors = DEFAULT_WORLD_SYSTEM_COLORS[node.system]
    return systemColors?.primary || '#00ff41'
  }, [])

  // Get node radius based on impact
  const getNodeRadius = useCallback((node: CascadeNode): number => {
    const baseRadius = 8
    return baseRadius + node.impact * 2
  }, [])

  // Memoized calculations for performance optimization
  const cascadeData = useMemo(() => data || DEFAULT_CASCADE_DATA, [data])

  const memoizedForceConfig = useMemo(() => {
    return memoizeForceConfig(dimensions, cascadeData.nodes.length)
  }, [dimensions, cascadeData.nodes.length])

  const memoizedCollisionConfig = useMemo(() => {
    return memoizeCollisionDetection(cascadeData.nodes)
  }, [cascadeData.nodes])

  // Performance monitoring in development
  // @ts-ignore - import.meta.env causes issues in Jest test environment
  if (import.meta.env.DEV) {
    console.log('🚀 Memo Cache Stats:', getMemoCacheStats())
  }

  // Initialize and update D3.js visualization with memory optimization
  useEffect(() => {
    if (!svgRef.current || isLoading || error) return

    // Start performance monitoring
    performanceMonitor.startRender()

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Clear previous visualization

    // Set up SVG with responsive dimensions
    svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    // Create container group for zoom/pan
    const container = svg.append('g')

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', event => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create force simulation with memoized configuration
    const simulation = d3
      .forceSimulation<SimulatedNode>(cascadeData.nodes as SimulatedNode[])
      .force(
        'link',
        d3
          .forceLink<SimulatedNode, SimulatedLink>(cascadeData.connections as SimulatedLink[])
          .id((d) => d.id)
          .strength((d) => d.strength)
          .distance(memoizedForceConfig.linkDistance)
      )
      .force('charge', d3.forceManyBody<SimulatedNode>().strength(memoizedForceConfig.chargeStrength))
      .force('center', d3.forceCenter<SimulatedNode>(memoizedForceConfig.center.x, memoizedForceConfig.center.y))
      .force(
        'collision',
        d3.forceCollide<SimulatedNode>()
          .radius((d) => getNodeRadius(d) + 10)
          .strength(memoizedCollisionConfig.strength)
      )
      .velocityDecay(memoizedForceConfig.velocityDecay)
      .alphaDecay(memoizedForceConfig.alphaDecay)
      .alphaMin(memoizedForceConfig.alphaMin)

    simulationRef.current = simulation

    // Create connection lines
    const links = container
      .append('g')
      .attr('class', 'cascade-links')
      .selectAll('line')
      .data(cascadeData.connections)
      .enter()
      .append('line')
      .attr('class', 'cascade-connection')
      .attr('stroke', '#00ffff')
      .attr('stroke-width', (d) => Math.max(1, d.strength * 3))
      .attr('stroke-opacity', 0.8)
      .attr('data-connection-type', (d) => d.type)

    // Create node groups
    const nodeGroups = container
      .append('g')
      .attr('class', 'cascade-nodes')
      .selectAll('g')
      .data(cascadeData.nodes)
      .enter()
      .append('g')
      .attr('class', 'cascade-node')
      .attr('data-node-type', (d) => d.type)
      .attr('data-node-system', (d) => d.system)
      .style('cursor', 'pointer')

    // Add node circles with retro glow effect
    nodeGroups
      .append('circle')
      .attr('class', 'node-circle')
      .attr('r', 0)
      .attr('fill', (d) => getNodeColor(d))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#neonGlow)')

    // Add node labels
    nodeGroups
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', -20)
      .attr('font-family', 'VT323, monospace')
      .attr('font-size', '12px')
      .attr('fill', '#ffffff')
      .attr('stroke', '#000000')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke fill')
      .text((d) => {
        return d.label.length > 20 ? d.label.substring(0, 17) + '...' : d.label
      })

    // Add system labels
    nodeGroups
      .append('text')
      .attr('class', 'system-label')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-family', 'VT323, monospace')
      .attr('font-size', '10px')
      .attr('fill', '#cccccc')
      .attr('stroke', '#000000')
      .attr('stroke-width', 2)
      .attr('paint-order', 'stroke fill')
      .text((d) => d.system.toUpperCase())

    // Add retro definitions (filters, gradients)
    const defs = svg.append('defs')

    // Neon glow filter
    defs
      .append('filter')
      .attr('id', 'neonGlow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%').html(`
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
        <feFlood flood-color="#00ffff" flood-opacity="0.5" result="color"/>
        <feComposite in="color" in2="blur" operator="in" result="softGlow"/>
        <feComposite in="softGlow" in2="SourceGraphic" operator="over"/>
      `)

    // CSS-only scanlines are now applied via cascade.css ::before and ::after pseudo-elements
    // This provides significant performance improvement by eliminating DOM manipulation

    // Animation for node appearance
    nodeGroups
      .selectAll('circle')
      .transition()
      .duration(1000)
      .delay((d) => ((d as CascadeNode).delay) ? (d as CascadeNode).delay! * 500 : 0)
      .attr('r', (d) => getNodeRadius(d as CascadeNode))
      .ease(d3.easeBackOut)

    // Animation for connection appearance
    links
      .transition()
      .duration(800)
      .delay((d) => ((d as CascadeConnection).delay || 0) * 500 + 200)
      .attr('stroke-opacity', 0.8)
      .attr('stroke-dasharray', function(this: SVGLineElement) {
        const length = this.getTotalLength()
        return `${length} ${length}`
      })
      .attr('stroke-dashoffset', function (this: SVGLineElement) {
        return this.getTotalLength()
      })
      .transition()
      .duration(800)
      .attr('stroke-dashoffset', 0)

    // Handle node interactions
    nodeGroups
      .on('mouseenter', function (_event, d) {
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', getNodeRadius(d as CascadeNode) * 1.2)

        setHoveredNode(d as CascadeNode)
        onNodeHover?.(d as CascadeNode)
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this).select('circle').transition().duration(200).attr('r', getNodeRadius(d as CascadeNode))

        setHoveredNode(null)
        onNodeHover?.(null)
      })
      .on('click', (_event, d) => {
        onNodeClick?.(d as CascadeNode)
      })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d) => ((d as SimulatedLink).source as SimulatedNode).x || 0)
        .attr('y1', (d) => ((d as SimulatedLink).source as SimulatedNode).y || 0)
        .attr('x2', (d) => ((d as SimulatedLink).target as SimulatedNode).x || 0)
        .attr('y2', (d) => ((d as SimulatedLink).target as SimulatedNode).y || 0)

      nodeGroups.attr('transform', (d: CascadeNode) => `translate(${d.x || 0}, ${d.y || 0})`)
    })

    // Enhanced cleanup
    return () => {
      // End performance monitoring
      performanceMonitor.endRender();

      if (simulation) {
        simulation.stop();
        simulationRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Clear D3 selections
      svg.selectAll('*').remove();
    };
  }, [data, isLoading, error, dimensions, onNodeClick, onNodeHover, getNodeColor, getNodeRadius, cascadeData, memoizedForceConfig, memoizedCollisionConfig])

  // Loading state
  if (isLoading) {
    return (
      <div className={`cascade-visualization loading ${className}`} style={{ width, height }}>
        <div className="loading-overlay">
          <div className="loading-text">PROCESSING CASCADE...</div>
          <div className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`cascade-visualization error ${className}`} style={{ width, height }}>
        <div className="error-overlay">
          <div className="error-text">CASCADE ERROR: {error}</div>
          <div className="error-subtext">Retrying connection...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`cascade-visualization ${className}`}>
      <svg
        ref={svgRef}
        className="cascade-svg"
        style={{ width: dimensions.width, height: dimensions.height }}
      />
      {hoveredNode && (
        <div className="node-tooltip">
          <div className="tooltip-title">{hoveredNode.label}</div>
          <div className="tooltip-system">System: {hoveredNode.system}</div>
          <div className="tooltip-impact">Impact: {hoveredNode.impact}/10</div>
          {hoveredNode.description && (
            <div className="tooltip-description">{hoveredNode.description}</div>
          )}
        </div>
      )}
      <PerformanceWarnings
        nodeCount={cascadeData.nodes.length}
        connectionCount={cascadeData.connections.length}
      />
    </div>
  )
}

export default CascadeVisualization