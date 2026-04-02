import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  changePassword,
  verifyPassword,
} from '../services/user.service.js'
import {
  createSession,
  findSessionByRefreshToken,
  invalidateSession,
  invalidateAllSessions,
} from '../services/session.service.js'
import { verifyToken, signAccessToken } from '../utils/jwt.js'
import { AppError } from '../middleware/error.js'
import type { AuthRequest } from '../middleware/auth.js'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional().default(''),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body)
    const user = await createUser(data.email, data.password, data.firstName, data.lastName)
    const tokens = await createSession(
      user.id,
      user.email,
      req.headers['user-agent'],
      req.ip
    )
    res.status(201).json({ user, ...tokens })
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body)
    const user = await findUserByEmail(data.email)
    if (!user?.hashedPw) throw new AppError(401, 'Invalid credentials')

    const valid = await verifyPassword(data.password, user.hashedPw)
    if (!valid) throw new AppError(401, 'Invalid credentials')

    const tokens = await createSession(
      user.id,
      user.email,
      req.headers['user-agent'],
      req.ip
    )

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body)

    const payload = verifyToken(refreshToken, 'refresh')
    const session = await findSessionByRefreshToken(refreshToken)

    if (!session || !session.isActive) throw new AppError(401, 'Invalid or expired session')

    const accessToken = signAccessToken({ userId: payload.userId, email: payload.email })
    res.json({ accessToken })
  } catch (err) {
    next(err)
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await findUserById(req.user!.id)
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = z
      .object({ firstName: z.string().min(1).optional(), lastName: z.string().min(1).optional() })
      .parse(req.body)
    const user = await updateUser(req.user!.id, data)
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export async function updatePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { oldPassword, newPassword } = z
      .object({ oldPassword: z.string(), newPassword: z.string().min(8) })
      .parse(req.body)
    await changePassword(req.user!.id, oldPassword, newPassword)
    res.json({ message: 'Password updated' })
  } catch (err) {
    next(err)
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken, all } = z
      .object({ refreshToken: z.string().optional(), all: z.boolean().optional() })
      .parse(req.body)

    if (all) {
      await invalidateAllSessions(req.user!.id)
    } else if (refreshToken) {
      await invalidateSession(refreshToken)
    }

    res.json({ message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}
