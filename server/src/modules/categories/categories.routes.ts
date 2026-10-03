import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { createCategorySchema } from './categories.schemas'
import * as controller from './categories.controller'

const router = Router()

router.use(requireAuth)

router.get('/', controller.list)
router.post('/', validate(createCategorySchema), controller.create)
router.delete('/:id', controller.remove)

export default router