import { prisma } from '../config/db.js'
import { signAccessToken, signRefreshToken } from '../utils/jwt.js'

export async function createSession(
  userId: string,
  email: string,
  userAgent?: string,
  ipAddress?: string
) {
  const accessToken = signAccessToken({ userId, email })
  const refreshToken = signRefreshToken({ userId, email })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.session.create({
    data: {
      userId,
      token: accessToken,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt,
    },
  })

  return { accessToken, refreshToken }
}

export async function findSessionByRefreshToken(refreshToken: string) {
  return prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  })
}

export async function invalidateSession(refreshToken: string) {
  await prisma.session.updateMany({
    where: { refreshToken },
    data: { isActive: false },
  })
}

export async function invalidateAllSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId },
    data: { isActive: false },
  })
}
