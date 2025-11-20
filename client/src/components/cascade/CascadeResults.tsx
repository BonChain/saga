import React, { useState, useMemo } from 'react'
import type {
  CascadeResultsProps,
  CascadeNode,
  CascadeFilter,
  UserContext
} from './types/cascade'
import { DEFAULT_WORLD_SYSTEM_COLORS, DEFAULT_CASCADE_DATA } from './types/cascade'
import ConsequenceCard from './ConsequenceCard'
import './styles/cascade.css'

// Helper functions moved outside component to fix React Compiler memoization
function calculateFamiliarity(node: CascadeNode, userContext: UserContext): 'known' | 'unknown' {
  // If user has discovered the location or completed related quests, it's known
  if (userContext.discoveredLocations.some(loc => node.system.toLowerCase().includes(loc.toLowerCase()))) {
    return 'known'
  }
  if (userContext.completedQuests.some(quest => node.label.toLowerCase().includes(quest.toLowerCase()))) {
    return 'known'
  }
  // Otherwise it's an unknown world effect
  return 'unknown'
}

function calculateSeverity(impact: number): 'minor' | 'major' | 'critical' {
  if (impact <= 3) return 'minor'
  if (impact <= 6) return 'major'
  return 'critical'
}

function calculatePersonalRelevance(node: CascadeNode, userContext: UserContext): number {
  let score = 50 // Base score

  // Boost relevance if related to user's items or locations
  if (userContext.items.some(item => node.label.toLowerCase().includes(item.toLowerCase()))) {
    score += 30
  }
  if (userContext.discoveredLocations.some(loc => node.system.toLowerCase().includes(loc.toLowerCase()))) {
    score += 20
  }

  // Adjust based on impact
  score += (node.impact - 5) * 5

  return Math.max(0, Math.min(100, score))
}

function generateNarrative(node: CascadeNode): string {
  if (node.description) return node.description

  const actions = ['transforms', 'alters', 'changes', 'modifies', 'disrupts']
  const outcomes = ['future', 'destiny', 'pathways', 'possibilities', 'interactions']

  const action = actions[Math.floor(Math.random() * actions.length)]
  const outcome = outcomes[Math.floor(Math.random() * outcomes.length)]

  return `This ${action} the ${outcome} of ${node.label.toLowerCase()}, creating lasting changes in the ${node.system} system.`
}

/**
 * CascadeResults Component
 * Mobile-first scrollable timeline of consequence cards with Known/Unknown filtering
 * Story 8.2 - Cascade Visualization Engine
 */
const CascadeResults: React.FC<CascadeResultsProps> = ({
  data,
  isLoading = false,
  error = null,
  className = ''
}) => {
  const [filter, setFilter] = useState<CascadeFilter>({
    showKnown: true,
    showUnknown: true
  })

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // Memoized cascade data for performance optimization
  const cascadeData = useMemo(() => data || DEFAULT_CASCADE_DATA, [data])

  // Mock user context - in real implementation this would come from global state or props
  const mockUserContext: UserContext = useMemo(() => ({
    completedQuests: ['dragon-introduction', 'village-welcome'],
    discoveredLocations: ['village', 'forest-entrance'],
    items: ['iron-sword', 'healing-potion'],
    dialogHistory: ['guard-greeting', 'blacksmith-introduction']
  }), [])

  // Processed consequences with familiarity scoring and filtering
  const processedConsequences = useMemo(() => {
    return cascadeData.nodes
      .filter(node => node.type !== 'action') // Only show consequences and butterfly effects
      .map(node => ({
        ...node,
        familiarity: calculateFamiliarity(node, mockUserContext),
        severity: calculateSeverity(node.impact),
        personalRelevance: calculatePersonalRelevance(node, mockUserContext),
        narrative: node.description || generateNarrative(node),
        isExpanded: expandedCards.has(node.id)
      }))
      .filter(node => {
        // Show consequences based on active filters
        if (!filter.showKnown && node.familiarity === 'known') return false
        if (!filter.showUnknown && node.familiarity === 'unknown') return false
        return true
      })
      .sort((a, b) => (a.delay || 0) - (b.delay || 0)) // Sort by timeline
  }, [cascadeData.nodes, mockUserContext, filter, expandedCards])

  // Toggle card expansion
  const toggleCardExpansion = (nodeId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className={`cascade-results ${className}`}>
        <div className="cascade-loading">
          <div className="loading-text">Processing consequences...</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`cascade-results ${className}`}>
        <div className="cascade-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">Unable to load consequences</div>
          <div className="error-details">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`cascade-results ${className}`}>
      {/* Filter Controls */}
      <div className="cascade-filter">
        <h3 className="filter-title">Consequences</h3>
        <div className="filter-toggle">
          <button
            className={`filter-button ${filter.showKnown ? 'active known' : 'inactive'}`}
            onClick={() => setFilter(prev => {
              const newShowKnown = !prev.showKnown;
              // If turning off known and unknown is already off, turn both back on
              if (!newShowKnown && !prev.showUnknown) {
                return { showKnown: true, showUnknown: true };
              }
              return { ...prev, showKnown: newShowKnown };
            })}
            aria-label={`${filter.showKnown ? 'Show only unknown consequences' : 'Show known consequences'}`}
            aria-pressed={filter.showKnown}
          >
            Known
          </button>
          <button
            className={`filter-button ${filter.showUnknown ? 'active unknown' : 'inactive'}`}
            onClick={() => setFilter(prev => {
              const newShowUnknown = !prev.showUnknown;
              // If turning off unknown and known is already off, turn both back on
              if (!newShowUnknown && !prev.showKnown) {
                return { showKnown: true, showUnknown: true };
              }
              return { ...prev, showUnknown: newShowUnknown };
            })}
            aria-label={`${filter.showUnknown ? 'Show only known consequences' : 'Show unknown consequences'}`}
            aria-pressed={filter.showUnknown}
          >
            Unknown
          </button>
        </div>
        <div className="filter-count">
          {processedConsequences.length} consequence{processedConsequences.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Consequence Cards */}
      <div className="cascade-timeline">
        {processedConsequences.length === 0 ? (
          <div className="no-consequences">
            <div className="no-results-icon">🎭</div>
            <div className="no-results-text">No consequences match current filter</div>
          </div>
        ) : (
          processedConsequences.map((consequence, index) => (
            <ConsequenceCard
              key={consequence.id}
              consequence={consequence}
              isExpanded={consequence.isExpanded}
              onToggle={() => toggleCardExpansion(consequence.id)}
              worldSystemColors={DEFAULT_WORLD_SYSTEM_COLORS}
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default CascadeResults