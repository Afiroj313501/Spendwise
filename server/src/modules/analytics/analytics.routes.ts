import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validateQuery } from '../../middleware/validate'
import { summaryQuerySchema } from './analytics.schemas'
import * as controller from './analytics.controller'

const router = Router()

router.use(requireAuth)
router.get('/summary', validateQuery(summaryQuerySchema), controller.summary)

export default router