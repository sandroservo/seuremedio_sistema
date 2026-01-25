/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Cliente Prisma singleton para Next.js
 * Prisma 7 requer adapter para conexão direta com banco
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL não está definida')
}

// Cria pool de conexões PostgreSQL
const pool = new Pool({ connectionString: databaseUrl })

// Cria adapter Prisma para PostgreSQL
const adapter = new PrismaPg(pool)

// Cria cliente Prisma com adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
