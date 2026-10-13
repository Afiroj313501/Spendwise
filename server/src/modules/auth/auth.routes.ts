import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/auth'
import { loginLimiter, refreshLimiter, registerLimiter } from '../../middleware/rateLimits'
import { loginSchema, registerSchema } from './auth.schemas'
import * as controller from './auth.controller'

const router = Router()

router.post('/register', registerLimiter, validate(registerSchema), controller.register)
router.post('/login', loginLimiter, validate(loginSchema), controller.login)
router.post('/refresh', refreshLimiter, controller.refresh)
router.post('/logout', controller.logout)
router.get('/me', requireAuth, controller.me)

export default router