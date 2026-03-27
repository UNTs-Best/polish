import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from '../controllers/auth.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

const strictLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 })
const refreshLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 })

router.post('/register', strictLimit, authController.register)
router.post('/login', strictLimit, authController.login)
router.post('/refresh', refreshLimit, authController.refresh)
router.get('/me', requireAuth, authController.getMe)
router.put('/profile', requireAuth, authController.updateProfile)
router.post('/change-password', requireAuth, authController.changePassword)
router.post('/logout', requireAuth, authController.logout)

export default router
