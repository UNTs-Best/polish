import bcrypt from 'bcryptjs'
import { prisma } from '../config/db.js'
import { AppError } from '../middleware/error.js'

export async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new AppError(409, 'Email already registered')

  const hashedPw = await bcrypt.hash(password, 12)
  return prisma.user.create({
    data: { email, hashedPw, firstName, lastName },
    select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
  })
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
  })
}

export async function updateUser(
  id: string,
  data: { firstName?: string; lastName?: string }
) {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, firstName: true, lastName: true },
  })
}

export async function changePassword(id: string, oldPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user?.hashedPw) throw new AppError(400, 'Cannot change password for OAuth accounts')

  const valid = await bcrypt.compare(oldPassword, user.hashedPw)
  if (!valid) throw new AppError(401, 'Current password is incorrect')

  const hashedPw = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id }, data: { hashedPw } })
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
