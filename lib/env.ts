import { z } from 'zod'

// Funkcja do określenia czy jesteśmy na gałęzi main
function isMainBranch() {
  // W Vercel, sprawdzamy VERCEL_GIT_COMMIT_REF
  if (process.env.VERCEL_GIT_COMMIT_REF === 'main') return true
  // W Vercel, sprawdzamy VERCEL_GIT_COMMIT_REF dla dev
  if (process.env.VERCEL_GIT_COMMIT_REF === 'dev') return false
  // Lokalnie, sprawdzamy NODE_ENV
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_GIT_COMMIT_REF) return true
  // Domyślnie false (dev branch)
  return false
}

// Wybieramy odpowiednią zmienną DATABASE_URL
function getDatabaseUrl() {
  const isMain = isMainBranch()
  
  // Debug logging
  console.log('🔍 Environment Debug:')
  console.log('  VERCEL_GIT_COMMIT_REF:', process.env.VERCEL_GIT_COMMIT_REF)
  console.log('  NODE_ENV:', process.env.NODE_ENV)
  console.log('  isMain:', isMain)
  console.log('  DATABASE_URL_MAIN exists:', !!process.env.DATABASE_URL_MAIN)
  console.log('  DATABASE_URL_DEV exists:', !!process.env.DATABASE_URL_DEV)
  
  if (isMain) {
    console.log('  Using DATABASE_URL_MAIN')
    return process.env.DATABASE_URL_MAIN
  } else {
    console.log('  Using DATABASE_URL_DEV')
    return process.env.DATABASE_URL_DEV
  }
}

// Funkcja do sprawdzenia czy jesteśmy w trybie buildowania
function isBuildTime() {
  return process.env.NODE_ENV === 'production' && !process.env.VERCEL_GIT_COMMIT_REF
}

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

function validateEnv() {
  try {
    const validatedEnv = envSchema.parse(process.env)
    
    // Podczas buildowania nie wymagamy DATABASE_URL
    if (isBuildTime()) {
      return {
        ...validatedEnv,
        DATABASE_URL: 'dummy-url-for-build'
      }
    }
    
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

