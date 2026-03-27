import type { User } from '@prisma/client'

export type OAuthProvider = 'google' | 'github' | 'apple'

type OAuthTokens = { accessToken: string; refreshToken: string }
type OAuthUserInfo = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
}
type CallbackResult = {
  user: User
  accessToken: string
  refreshToken: string
}

export function getAuthUrl(provider: OAuthProvider, state: string): string {
  throw new Error('not implemented')
}

export async function exchangeCodeForToken(provider: OAuthProvider, code: string): Promise<string> {
  throw new Error('not implemented')
}

export async function getUserInfo(provider: OAuthProvider, accessToken: string): Promise<OAuthUserInfo> {
  throw new Error('not implemented')
}

export async function handleCallback(
  provider: OAuthProvider,
  code: string,
  userAgent: string,
  ipAddress: string,
): Promise<CallbackResult> {
  throw new Error('not implemented')
}

export function getAvailableProviders(): OAuthProvider[] {
  throw new Error('not implemented')
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  throw new Error('not implemented')
}

export function validateState(state: string, expectedState: string): boolean {
  throw new Error('not implemented')
}
