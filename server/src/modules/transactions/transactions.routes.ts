import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validate, validateQuery } from '../../middleware/validate'
import {
  createTransactionSchema,
  exportQuerySchema,
  listQuerySchema,
  updateTransactionSchema,
} from './transactions.schemas'
import * as controller from './transactions.controller'

const router = Router()

router.use(requireAuth) // every transaction route requires login

router.get('/', validateQuery(listQuerySchema), controller.list)
router.get('/export', validateQuery(exportQuerySchema), controller.exportCsv)
router.post('/', validate(createTransactionSchema), controller.create)
router.get('/:id', controller.getOne)
router.patch('/:id', validate(updateTransactionSchema), controller.update)
router.delete('/:id', controller.remove)

export default router