import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { signAccessToken, signRefreshToken, verifyToken } from '../../../src/utils/jwt.js'

const payload = { userId: 'user-123', email: 'user@example.com' }

describe('signAccessToken', () => {
  it('returns a non-empty JWT string', () => {
    const token = signAccessToken(payload)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('encodes userId and email in the token', () => {
    const token = signAccessToken(payload)
    const decoded = jwt.decode(token) as Record<string, unknown>
    expect(decoded.userId).toBe(payload.userId)
    expect(decoded.email).toBe(payload.email)
  })
})

describe('signRefreshToken', () => {
  it('returns a non-empty JWT string', () => {
    const token = signRefreshToken(payload)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('encodes userId and email in the token', () => {
    const token = signRefreshToken(payload)
    const decoded = jwt.decode(token) as Record<string, unknown>
    expect(decoded.userId).toBe(payload.userId)
    expect(decoded.email).toBe(payload.email)
  })
})

describe('verifyToken', () => {
  it('verifies a valid access token', () => {
    const token = signAccessToken(payload)
    const result = verifyToken(token, 'access')
    expect(result.userId).toBe(payload.userId)
    expect(result.email).toBe(payload.email)
  })

  it('verifies a valid refresh token', () => {
    const token = signRefreshToken(payload)
    const result = verifyToken(token, 'refresh')
    expect(result.userId).toBe(payload.userId)
    expect(result.email).toBe(payload.email)
  })

  it('throws JsonWebTokenError when access token is verified as refresh', () => {
    const token = signAccessToken(payload)
    expect(() => verifyToken(token, 'refresh')).toThrow(jwt.JsonWebTokenError)
  })

  it('throws JsonWebTokenError when refresh token is verified as access', () => {
    const token = signRefreshToken(payload)
    expect(() => verifyToken(token, 'access')).toThrow(jwt.JsonWebTokenError)
  })

  it('throws JsonWebTokenError for a tampered token', () => {
    const token = signAccessToken(payload)
    const tampered = token.slice(0, -5) + 'XXXXX'
    expect(() => verifyToken(tampered, 'access')).toThrow()
  })

  it('throws TokenExpiredError for an expired token', () => {
    const expired = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: -1 })
    expect(() => verifyToken(expired, 'access')).toThrow(jwt.TokenExpiredError)
  })
})
