import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validateQuery } from '../../middleware/validate'
import { cashflowQuerySchema, summaryQuerySchema } from './analytics.schemas'
import * as controller from './analytics.controller'

const router = Router()

router.use(requireAuth)
router.get('/summary', validateQuery(summaryQuerySchema), controller.summary)
router.get('/cashflow', validateQuery(cashflowQuerySchema), controller.cashflow)
router.get('/breakdown', validateQuery(summaryQuerySchema), controller.breakdown)

export default router