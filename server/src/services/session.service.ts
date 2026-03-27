import type { User, Session } from '@prisma/client'

type TokenPair = { accessToken: string; refreshToken: string }
type LoginResult = { session: Session; accessToken: string; refreshToken: string }

export function generateAccessToken(user: User): string {
  throw new Error('not implemented')
}

export function generateRefreshToken(user: User): { token: string; tokenId: string } {
  throw new Error('not implemented')
}

export function verifyAccessToken(token: string): { id: string; email: string; provider: string; type: string } {
  throw new Error('not implemented')
}

export function verifyRefreshToken(token: string): { id: string; tokenId: string } {
  throw new Error('not implemented')
}

export async function loginUser(user: User, userAgent: string, ipAddress: string): Promise<LoginResult> {
  throw new Error('not implemented')
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  throw new Error('not implemented')
}

export async function logoutUser(userId: string, sessionId: string): Promise<void> {
  throw new Error('not implemented')
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  throw new Error('not implemented')
}

export async function deactivateSession(sessionId: string): Promise<void> {
  throw new Error('not implemented')
}

export async function deactivateAllUserSessions(userId: string): Promise<void> {
  throw new Error('not implemented')
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  throw new Error('not implemented')
}
