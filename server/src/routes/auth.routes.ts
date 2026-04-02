import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, refresh, me, updateProfile, updatePassword, logout } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later' },
})

export const authRouter = Router()

authRouter.post('/register', authLimiter, register)
authRouter.post('/login', authLimiter, login)
authRouter.post('/refresh', refresh)
authRouter.get('/me', requireAuth, me)
authRouter.put('/profile', requireAuth, updateProfile)
authRouter.post('/change-password', requireAuth, updatePassword)
authRouter.post('/logout', requireAuth, logout)
