import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { createGoalSchema, fundsSchema, updateGoalSchema } from './goals.schemas'
import * as controller from './goals.controller'

const router = Router()

router.use(requireAuth)

router.get('/', controller.list)
router.post('/', validate(createGoalSchema), controller.create)
router.patch('/:id', validate(updateGoalSchema), controller.update)
router.post('/:id/funds', validate(fundsSchema), controller.funds)
router.delete('/:id', controller.remove)

export default router