import type { Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; provider: string; type: string }
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  throw new Error('not implemented')
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  throw new Error('not implemented')
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  throw new Error('not implemented')
}
