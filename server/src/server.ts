import 'dotenv/config'
import app from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/db.js'
import { redis } from './config/redis.js'

const PORT = Number(env.PORT)
app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT} (${env.NODE_ENV})`)
})

const shutdown = async () => {
  console.log('[server] shutting down...')
  await prisma.$disconnect()
  redis.quit()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
