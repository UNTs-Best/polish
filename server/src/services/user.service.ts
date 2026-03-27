import type { User } from '@prisma/client'
import prisma from '../config/db'

type CreateUserData = {
  email: string
  passwordHash?: string
  firstName?: string
  lastName?: string
  displayName?: string
  avatarUrl?: string
  authProvider?: string
  authProviderId?: string
  emailVerified?: boolean
}

type UpdateUserData = Partial<Pick<User, 'firstName' | 'lastName' | 'displayName' | 'avatarUrl'>>

export async function createUser(data: CreateUserData): Promise<User> {
  throw new Error('not implemented')
}

export async function getUserByEmail(email: string): Promise<User | null> {
  throw new Error('not implemented')
}

export async function getUserById(id: string): Promise<User | null> {
  throw new Error('not implemented')
}

export async function getUserByProviderId(provider: string, providerId: string): Promise<User | null> {
  throw new Error('not implemented')
}

export async function createOAuthUser(provider: string, providerData: {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
}): Promise<User> {
  throw new Error('not implemented')
}

export async function updateUser(id: string, updates: UpdateUserData): Promise<User> {
  throw new Error('not implemented')
}

export async function deleteUser(id: string): Promise<void> {
  throw new Error('not implemented')
}

export async function getAllUsers(limit: number, offset: number): Promise<User[]> {
  throw new Error('not implemented')
}
