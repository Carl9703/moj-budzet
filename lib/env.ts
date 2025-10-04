import { z } from 'zod'

const envSchema = z.object({
<<<<<<< HEAD
  DATABASE_URL_MAIN: z.string().min(1, 'DATABASE_URL_MAIN is required for main branch'),
=======
  DATABASE_URL_DEV: z.string().min(1, 'DATABASE_URL_DEV is required for dev branch'),
>>>>>>> dev
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

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
        `   DATABASE_URL=<your-database-url>\n`
      )
    }
    throw error
  }
}

export const env = validateEnv()

