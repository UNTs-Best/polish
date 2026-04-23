import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../../../src/middleware/auth.js'

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
}))

vi.mock('../../../src/config/db.js', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/config/redis.js', () => ({
  redis: { on: vi.fn(), ping: vi.fn(), quit: vi.fn() },
}))

import { requireAuth } from '../../../src/middleware/auth.js'
import { signAccessToken } from '../../../src/utils/jwt.js'
import jwt from 'jsonwebtoken'

const testUser = {
  id: 'user-uuid-001',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  hashedPw: 'hashed',
  oauthProvider: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeReqRes(authorizationHeader?: string) {
  const req = { headers: authorizationHeader ? { authorization: authorizationHeader } : {} } as AuthRequest
  const res = {} as Response
  const next = vi.fn() as NextFunction
  return { req, res, next }
}

beforeEach(() => vi.clearAllMocks())

describe('requireAuth', () => {
  it('calls next(AppError 401) when Authorization header is absent', async () => {
    const { req, res, next } = makeReqRes()
    await requireAuth(req, res, next)
    const err = vi.mocked(next).mock.calls[0][0] as { statusCode: number }
    expect(err.statusCode).toBe(401)
  })

  it('calls next(AppError 401) when header does not start with "Bearer "', async () => {
    const { req, res, next } = makeReqRes('Basic dXNlcjpwYXNz')
    await requireAuth(req, res, next)
    const err = vi.mocked(next).mock.calls[0][0] as { statusCode: number }
    expect(err.statusCode).toBe(401)
  })

  it('calls next with JsonWebTokenError for an invalid token', async () => {
    const { req, res, next } = makeReqRes('Bearer not.a.valid.jwt')
    await requireAuth(req, res, next)
    expect(vi.mocked(next).mock.calls[0][0]).toBeInstanceOf(jwt.JsonWebTokenError)
  })

  it('calls next with TokenExpiredError for an expired token', async () => {
    const expired = jwt.sign({ userId: testUser.id, email: testUser.email }, process.env.JWT_SECRET!, { expiresIn: -1 })
    const { req, res, next } = makeReqRes(`Bearer ${expired}`)
    await requireAuth(req, res, next)
    expect(vi.mocked(next).mock.calls[0][0]).toBeInstanceOf(jwt.TokenExpiredError)
  })

  it('calls next(AppError 401) when user is not found in the database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const token = signAccessToken({ userId: testUser.id, email: testUser.email })
    const { req, res, next } = makeReqRes(`Bearer ${token}`)
    await requireAuth(req, res, next)
    const err = vi.mocked(next).mock.calls[0][0] as { statusCode: number }
    expect(err.statusCode).toBe(401)
  })

  it('attaches req.user and calls next() with no args on valid token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(testUser)
    const token = signAccessToken({ userId: testUser.id, email: testUser.email })
    const { req, res, next } = makeReqRes(`Bearer ${token}`)
    await requireAuth(req, res, next)
    expect(vi.mocked(next)).toHaveBeenCalledWith()
    expect(req.user).toEqual({
      id: testUser.id,
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
    })
  })
})
