import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validate, validateQuery } from '../../middleware/validate'
import { copyBudgetsSchema, monthQuerySchema, saveBudgetSchema } from './budgets.schemas'
import * as controller from './budgets.controller'

const router = Router()

router.use(requireAuth)

router.get('/', validateQuery(monthQuerySchema), controller.list)
router.put('/', validate(saveBudgetSchema), controller.save)
router.post('/copy', validate(copyBudgetsSchema), controller.copy)
router.delete('/:id', controller.remove)

export default router