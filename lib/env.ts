import { z } from 'zod'

// Funkcja do określenia czy jesteśmy na gałęzi main
function isMainBranch() {
  // W Vercel, sprawdzamy VERCEL_GIT_COMMIT_REF
  if (process.env.VERCEL_GIT_COMMIT_REF === 'main') return true
  // W development, sprawdzamy NODE_ENV
  if (process.env.NODE_ENV === 'production') return true
  // Domyślnie false (dev branch)
  return false
}

// Wybieramy odpowiednią zmienną DATABASE_URL
function getDatabaseUrl() {
  const isMain = isMainBranch()
  
  if (isMain) {
    return process.env.DATABASE_URL_MAIN || process.env.DATABASE_URL
  } else {
    return process.env.DATABASE_URL_DEV || process.env.DATABASE_URL
  }
}

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

function validateEnv() {
  try {
    const validatedEnv = envSchema.parse(process.env)
    
    // Sprawdzamy czy mamy odpowiednią zmienną DATABASE_URL
    const databaseUrl = getDatabaseUrl()
    if (!databaseUrl) {
      const isMain = isMainBranch()
      const requiredVar = isMain ? 'DATABASE_URL_MAIN' : 'DATABASE_URL_DEV'
      throw new Error(
        `\n🔴 Missing database URL for ${isMain ? 'main' : 'dev'} branch:\n` +
        `   Required: ${requiredVar}\n` +
        `   Current branch: ${process.env.VERCEL_GIT_COMMIT_REF || 'local'}\n\n` +
        `💡 Set environment variable in Vercel:\n` +
        `   ${requiredVar}=<your-database-url>\n`
      )
    }
    
    return {
      ...validatedEnv,
      DATABASE_URL: databaseUrl
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(e => `  ❌ ${e.path.join('.')}: ${e.message}`).join('\n')
      throw new Error(
        `\n🔴 Invalid environment variables:\n${missingVars}\n\n` +
        `💡 Create .env.local file with:\n` +
        `   JWT_SECRET=<random-string-min-32-chars>\n` +
        `   DATABASE_URL_DEV=<your-dev-database-url>\n` +
        `   DATABASE_URL_MAIN=<your-main-database-url>\n`
      )
    }
    throw error
  }
}

export const env = validateEnv()

