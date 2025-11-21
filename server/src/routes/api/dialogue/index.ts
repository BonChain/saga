/**
 * Dialogue API Routes - Story 4.2: Dynamic Dialogue Generation
 *
 * Main router for all dialogue-related API endpoints
 */

import { Router } from 'express'
import generateRoutes from './generate'

const router = Router()

// Mount dialogue generation routes
router.use('/', generateRoutes)

export default router