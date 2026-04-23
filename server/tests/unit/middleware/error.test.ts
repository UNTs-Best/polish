import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { ZodError, z } from 'zod'
import { Prisma } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { AppError, errorHandler } from '../../../src/middleware/error.js'

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
}

const req = {} as Request
const next = vi.fn() as NextFunction

describe('AppError', () => {
  it('sets statusCode and message', () => {
    const err = new AppError(404, 'Not found')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Not found')
    expect(err.name).toBe('AppError')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('errorHandler', () => {
  it('responds with AppError statusCode and message', () => {
    const res = makeRes()
    errorHandler(new AppError(403, 'Forbidden'), req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' })
  })

  it('responds 400 with field-level details for ZodError', () => {
    const res = makeRes()
    let zodErr!: ZodError
    try {
      z.object({ email: z.string().email(), age: z.number() }).parse({ email: 'bad', age: 'x' })
    } catch (e) {
      zodErr = e as ZodError
    }
    errorHandler(zodErr, req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string; details: { field: string; message: string }[] }
    expect(body.error).toBe('Validation error')
    expect(body.details.length).toBeGreaterThanOrEqual(2)
    expect(body.details[0]).toHaveProperty('field')
    expect(body.details[0]).toHaveProperty('message')
  })

  it('responds 404 for Prisma P2025 (record not found)', () => {
    const res = makeRes()
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '5.0',
    })
    errorHandler(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource not found' })
  })

  it('responds 409 for Prisma P2002 (unique constraint violation)', () => {
    const res = makeRes()
    const err = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: '5.0',
    })
    errorHandler(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource already exists' })
  })

  it('responds 401 for TokenExpiredError', () => {
    const res = makeRes()
    errorHandler(new jwt.TokenExpiredError('expired', new Date()), req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' })
  })

  it('responds 401 for JsonWebTokenError', () => {
    const res = makeRes()
    errorHandler(new jwt.JsonWebTokenError('invalid'), req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' })
  })

  it('responds 500 for unknown errors', () => {
    const res = makeRes()
    errorHandler(new Error('unexpected'), req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string }
    expect(body).toHaveProperty('error')
  })
})
