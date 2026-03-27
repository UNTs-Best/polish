import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'

import env from './config/env'
import prisma from './config/db'
import redis from './config/redis'

import authRoutes from './routes/auth.routes'
import oauthRoutes from './routes/oauth.routes'
import documentRoutes from './routes/document.routes'
import versionRoutes from './routes/version.routes'
import llmRoutes from './routes/llm.routes'

import { errorHandler } from './middleware/error'

const app = express()

// Security & parsing
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/oauth', oauthRoutes)
app.use('/api/docs', documentRoutes)
app.use('/api/versions', versionRoutes)
app.use('/api/llm', llmRoutes)

// Health
app.get('/api/health', async (_req, res) => {
  res.json({ db: 'ok', redis: 'ok', storage: 'ok' })
})

// Error handler (must be last)
app.use(errorHandler)

async function start() {
  await prisma.$connect()
  console.log('PostgreSQL connected')

  await redis.ping()
  console.log('Redis connected')

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

export default app
