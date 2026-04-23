import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
}))

vi.mock('../../../src/config/db.js', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/config/redis.js', () => ({
  redis: { on: vi.fn(), ping: vi.fn(), quit: vi.fn() },
}))

import {
  createSession,
  findSessionByRefreshToken,
  invalidateSession,
  invalidateAllSessions,
} from '../../../src/services/session.service.js'
import jwt from 'jsonwebtoken'

const userId = 'user-001'
const email = 'alice@example.com'

beforeEach(() => vi.clearAllMocks())

describe('createSession', () => {
  it('returns signed accessToken and refreshToken', async () => {
    mockPrisma.session.create.mockResolvedValue({})

    const { accessToken, refreshToken } = await createSession(userId, email)

    expect(typeof accessToken).toBe('string')
    expect(typeof refreshToken).toBe('string')
    const access = jwt.decode(accessToken) as Record<string, unknown>
    const refresh = jwt.decode(refreshToken) as Record<string, unknown>
    expect(access.userId).toBe(userId)
    expect(refresh.userId).toBe(userId)
  })

  it('persists the session in the database with a 7-day expiry', async () => {
    mockPrisma.session.create.mockResolvedValue({})
    const before = Date.now()

    await createSession(userId, email, 'Mozilla/5.0', '127.0.0.1')

    expect(mockPrisma.session.create).toHaveBeenCalledOnce()
    const { data } = mockPrisma.session.create.mock.calls[0][0]
    expect(data.userId).toBe(userId)
    expect(data.userAgent).toBe('Mozilla/5.0')
    expect(data.ipAddress).toBe('127.0.0.1')
    const expiresMs = data.expiresAt.getTime() - before
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    expect(expiresMs).toBeGreaterThan(sevenDaysMs - 1000)
    expect(expiresMs).toBeLessThan(sevenDaysMs + 1000)
  })
})

describe('findSessionByRefreshToken', () => {
  it('returns the session when found', async () => {
    const session = { id: 'sess-1', refreshToken: 'token', isActive: true }
    mockPrisma.session.findUnique.mockResolvedValue(session)

    const result = await findSessionByRefreshToken('token')
    expect(result).toEqual(session)
    expect(mockPrisma.session.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { refreshToken: 'token' } })
    )
  })

  it('returns null when session is not found', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(null)
    expect(await findSessionByRefreshToken('bad-token')).toBeNull()
  })
})

describe('invalidateSession', () => {
  it('marks the session inactive by refreshToken', async () => {
    mockPrisma.session.updateMany.mockResolvedValue({ count: 1 })

    await invalidateSession('my-refresh-token')

    expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
      where: { refreshToken: 'my-refresh-token' },
      data: { isActive: false },
    })
  })
})

describe('invalidateAllSessions', () => {
  it('marks all user sessions inactive', async () => {
    mockPrisma.session.updateMany.mockResolvedValue({ count: 3 })

    await invalidateAllSessions(userId)

    expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId },
      data: { isActive: false },
    })
  })
})
