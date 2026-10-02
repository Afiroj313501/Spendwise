import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/auth'
import { loginSchema, registerSchema } from './auth.schemas'
import * as controller from './auth.controller'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
})

const router = Router()

router.post('/register', authLimiter, validate(registerSchema), controller.register)
router.post('/login', authLimiter, validate(loginSchema), controller.login)
router.post('/refresh', controller.refresh)
router.post('/logout', controller.logout)
router.get('/me', requireAuth, controller.me)

export default router