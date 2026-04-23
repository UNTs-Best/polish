import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import { prisma } from './config/db.js'
import { redis } from './config/redis.js'
import { authRouter } from './routes/auth.routes.js'
import { documentRouter } from './routes/document.routes.js'
import { versionRouter } from './routes/version.routes.js'
import { llmRouter } from './routes/llm.routes.js'
import { errorHandler } from './middleware/error.js'

const app = express()

// Security
app.use(helmet())
const allowedOrigins = [env.CLIENT_URL, '*']
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
      cb(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: true,
  })
)

// Parsing + compression
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(compression())

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// Global rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    const redisPing = await redis.ping()
    res.json({ status: 'ok', db: 'ok', redis: redisPing === 'PONG' ? 'ok' : 'error' })
  } catch (err) {
    res.status(503).json({ status: 'error', error: String(err) })
  }
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/docs', documentRouter)
app.use('/api/versions', versionRouter)
app.use('/api/llm', llmRouter)

// Global error handler
app.use(errorHandler)

const PORT = Number(env.PORT)
app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT} (${env.NODE_ENV})`)
})

// Graceful shutdown
const shutdown = async () => {
  console.log('[server] shutting down...')
  await prisma.$disconnect()
  redis.quit()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export default app
