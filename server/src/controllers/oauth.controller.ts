import type { Request, Response } from 'express'

export async function getProviders(req: Request, res: Response): Promise<void> {
  throw new Error('not implemented')
}

export async function getAuthUrl(req: Request, res: Response): Promise<void> {
  throw new Error('not implemented')
}

export async function handleCallback(req: Request, res: Response): Promise<void> {
  throw new Error('not implemented')
}

export async function initiateFlow(req: Request, res: Response): Promise<void> {
  throw new Error('not implemented')
}
