import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

interface TokenPayload {
  userId: string
  email: string
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions)
}

export function verifyToken(token: string, type: 'access' | 'refresh'): TokenPayload {
  const secret = type === 'access' ? env.JWT_SECRET : env.JWT_REFRESH_SECRET
  return jwt.verify(token, secret) as TokenPayload
}
