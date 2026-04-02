import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import { prisma } from '../config/db.js'
import { AppError } from './error.js'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; firstName: string; lastName: string }
}

export async function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing authorization header')
    }

    const token = header.slice(7)
    const payload = verifyToken(token, 'access')

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) throw new AppError(401, 'User not found')

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }
    next()
  } catch (err) {
    next(err)
  }
}
