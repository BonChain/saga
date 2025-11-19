import { http, HttpResponse } from 'msw';
import type { CascadeData } from '../components/cascade/types/cascade';

// Mock cascade data for different scenarios
const mockCascadeData: CascadeData = {
  actionId: 'action-001',
  nodes: [
    {
      id: 'action-001',
      type: 'action',
      label: 'Test Action',
      system: 'combat',
      description: 'A test action for cascade visualization',
      impact: 8,
      delay: 0,
      duration: 1,
    },
    {
      id: 'consequence-001',
      type: 'consequence',
      label: 'Test Consequence',
      system: 'environment',
      description: 'A direct consequence of the action',
      impact: 5,
      delay: 1,
      duration: 2,
    },
  ],
  connections: [
    {
      source: 'action-001',
      target: 'consequence-001',
      type: 'direct',
      strength: 0.8,
      delay: 1,
      duration: 2,
    },
  ],
  metadata: {
    totalNodes: 2,
    totalConnections: 1,
    processingTime: 2.5,
    worldSystemsAffected: ['combat', 'environment'],
    maxDepth: 1,
    severity: 'medium',
  },
  timestamp: new Date().toISOString(),
  playerId: 'test-player',
};

const mockSmallCascade: CascadeData = {
  actionId: 'small-action',
  nodes: [
    {
      id: 'small-action',
      type: 'action',
      label: 'Small Action',
      system: 'social',
      description: 'A small test action',
      impact: 3,
      delay: 0,
      duration: 1,
    },
  ],
  connections: [],
  metadata: {
    totalNodes: 1,
    totalConnections: 0,
    processingTime: 1.0,
    worldSystemsAffected: ['social'],
    maxDepth: 0,
    severity: 'low',
  },
  timestamp: new Date().toISOString(),
  playerId: 'test-player',
};

const mockLargeCascade: CascadeData = {
  actionId: 'large-action',
  nodes: Array.from({ length: 20 }, (_, i) => ({
    id: `node-${i}`,
    type: i === 0 ? 'action' : i < 10 ? 'consequence' : 'butterfly-effect',
    label: `Node ${i}`,
    system: ['combat', 'social', 'environment', 'economic'][i % 4],
    description: `Description for node ${i}`,
    impact: Math.random() * 10,
    delay: Math.random() * 3,
    duration: Math.random() * 2,
  })),
  connections: Array.from({ length: 25 }, (_, i) => ({
    source: `node-${Math.floor(i / 2)}`,
    target: `node-${Math.min(i + 1, 19)}`,
    type: i % 2 === 0 ? 'direct' : 'cascading',
    strength: Math.random(),
    delay: Math.random() * 2,
    duration: Math.random() * 2,
  })),
  metadata: {
    totalNodes: 20,
    totalConnections: 25,
    processingTime: 5.8,
    worldSystemsAffected: ['combat', 'social', 'environment', 'economic'],
    maxDepth: 3,
    severity: 'high',
  },
  timestamp: new Date().toISOString(),
  playerId: 'test-player',
};

const mockErrorResponse = {
  error: 'Cascade generation failed: Action too complex',
  timestamp: new Date().toISOString(),
};

// MSW handlers for REST API endpoints
export const handlers = [
  // Get cascade data for specific action
  http.get('/api/cascades/:actionId', ({ params }: any) => {
    const { actionId } = params;

    // Simulate different scenarios based on actionId
    switch (actionId) {
      case 'error-test':
        return HttpResponse.json(mockErrorResponse, { status: 500 });
      case 'large-test':
        return HttpResponse.json(mockLargeCascade);
      case 'small-test':
        return HttpResponse.json(mockSmallCascade);
      default:
        return HttpResponse.json(mockCascadeData);
    }
  }),

  // Submit action (existing endpoint)
  http.post('/api/actions/submit', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: `action-${Date.now()}`,
        status: 'submitted',
        timestamp: new Date().toISOString(),
      },
    });
  }),

  // Health check
  http.get('/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        cascade: 'operational',
        database: 'connected',
        websocket: 'ready',
      },
    });
  }),
];

export { mockCascadeData, mockSmallCascade, mockLargeCascade, mockErrorResponse };

// Simple mock WebSocket for tests
export const createMockWebSocket = () => {
  return {
    readyState: WebSocket.OPEN,
    addEventListener: () => {},
    removeEventListener: () => {},
    send: () => {},
    close: () => {},
    simulateOpen: () => {},
    simulateMessage: () => {},
    simulateError: () => {}
  } as unknown as WebSocket;
};