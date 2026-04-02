import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import pkg from 'jsonwebtoken'
const { JsonWebTokenError, TokenExpiredError } = pkg

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Resource not found' })
      return
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Resource already exists' })
      return
    }
  }

  if (err instanceof TokenExpiredError) {
    res.status(401).json({ error: 'Token expired' })
    return
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  console.error('[error]', err)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : String(err),
  })
}
