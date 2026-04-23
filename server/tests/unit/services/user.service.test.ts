import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../../src/config/db.js', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/config/redis.js', () => ({
  redis: { on: vi.fn(), ping: vi.fn(), quit: vi.fn() },
}))
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashed'),
    compare: vi.fn(),
  },
}))

import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  changePassword,
  verifyPassword,
} from '../../../src/services/user.service.js'
import bcrypt from 'bcryptjs'

const existingUser = {
  id: 'user-001',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  hashedPw: '$2a$12$hashed',
  oauthProvider: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('createUser', () => {
  it('hashes the password and creates a user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: existingUser.id,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      createdAt: existingUser.createdAt,
    })

    const result = await createUser('alice@example.com', 'password123', 'Alice', 'Smith')

    expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledWith('password123', 12)
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'alice@example.com', hashedPw: '$2a$12$hashed' }),
      })
    )
    expect(result.email).toBe('alice@example.com')
  })

  it('throws AppError 409 when email is already registered', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(existingUser)

    await expect(createUser('alice@example.com', 'password123', 'Alice', '')).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringMatching(/already registered/i),
    })
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })
})

describe('findUserByEmail', () => {
  it('returns user when found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(existingUser)
    const result = await findUserByEmail('alice@example.com')
    expect(result).toEqual(existingUser)
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } })
  })

  it('returns null when not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const result = await findUserByEmail('nobody@example.com')
    expect(result).toBeNull()
  })
})

describe('findUserById', () => {
  it('returns user when found', async () => {
    const publicUser = { id: existingUser.id, email: existingUser.email, firstName: existingUser.firstName, lastName: existingUser.lastName, createdAt: existingUser.createdAt }
    mockPrisma.user.findUnique.mockResolvedValue(publicUser)
    const result = await findUserById(existingUser.id)
    expect(result?.id).toBe(existingUser.id)
  })
})

describe('updateUser', () => {
  it('calls prisma.user.update with provided fields', async () => {
    mockPrisma.user.update.mockResolvedValue({ ...existingUser, firstName: 'Alicia' })
    const result = await updateUser(existingUser.id, { firstName: 'Alicia' })
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: existingUser.id }, data: { firstName: 'Alicia' } })
    )
    expect(result.firstName).toBe('Alicia')
  })
})

describe('changePassword', () => {
  it('hashes the new password and updates the user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(existingUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    mockPrisma.user.update.mockResolvedValue(existingUser)

    await changePassword(existingUser.id, 'oldpass', 'newpass123')

    expect(vi.mocked(bcrypt.compare)).toHaveBeenCalledWith('oldpass', existingUser.hashedPw)
    expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledWith('newpass123', 12)
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { hashedPw: '$2a$12$hashed' } })
    )
  })

  it('throws AppError 401 when the old password is wrong', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(existingUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    await expect(changePassword(existingUser.id, 'wrongpass', 'newpass123')).rejects.toMatchObject({
      statusCode: 401,
    })
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('throws AppError 400 when user has no hashed password (OAuth account)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...existingUser, hashedPw: null })

    await expect(changePassword(existingUser.id, 'any', 'newpass123')).rejects.toMatchObject({
      statusCode: 400,
    })
  })
})

describe('verifyPassword', () => {
  it('returns true when password matches', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    const result = await verifyPassword('plain', 'hash')
    expect(result).toBe(true)
  })

  it('returns false when password does not match', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)
    const result = await verifyPassword('plain', 'hash')
    expect(result).toBe(false)
  })
})
