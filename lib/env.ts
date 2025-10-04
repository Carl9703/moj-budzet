import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL_DEV: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
}).refine(
  (data) => data.DATABASE_URL || data.DATABASE_URL_DEV,
  { message: 'Either DATABASE_URL or DATABASE_URL_DEV must be provided' }
)

function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(e => `  ❌ ${e.path.join('.')}: ${e.message}`).join('\n')
      throw new Error(
        `\n🔴 Invalid environment variables:\n${missingVars}\n\n` +
        `💡 Create .env.local file with:\n` +
        `   JWT_SECRET=<random-string-min-32-chars>\n` +
        `   DATABASE_URL_DEV=<your-database-url>\n`
      )
    }
    throw error
  }
}

export const env = validateEnv()

