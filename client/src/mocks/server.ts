import { setupServer } from 'msw/mockServiceWorker';
import { handlers } from './handlers';

// Setup MSW server for Node environment (Jest)
export const server = setupServer(...handlers);