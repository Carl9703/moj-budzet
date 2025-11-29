const fs = require('fs');

// Sprawdź aktualną gałąź (lub użyj domyślnej wartości jeśli git nie jest dostępny)
let currentBranch = 'main';
try {
    const { execSync } = require('child_process');
    currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim() || 'main';
} catch (error) {
    // Jeśli git nie jest dostępny, użyj domyślnej wartości
    currentBranch = process.env.GIT_BRANCH || 'main';
    console.log(`Git not available, using default branch: ${currentBranch}`);
}

console.log(`Current branch: ${currentBranch}`);

// Prosta konfiguracja - dev używa DATABASE_URL_DEV, main używa DATABASE_URL
const databaseUrl = currentBranch === 'dev' 
  ? process.env.DATABASE_URL_DEV || 'postgresql://neondb_owner:npg_apn5b9QFTrYG@ep-flat-sound-adj5s9vt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  : process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_apn5b9QFTrYG@ep-flat-sound-adj5s9vt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const nodeEnv = currentBranch === 'dev' ? 'development' : 'production';

// Stwórz plik .env.local
const envContent = `# Auto-generated environment file for ${currentBranch} branch
# Generated on: ${new Date().toISOString()}

# Database URLs for different branches
DATABASE_URL=${databaseUrl}
DATABASE_URL_DEV=${databaseUrl}
DATABASE_URL_MAIN=${databaseUrl}

# NextAuth
NEXTAUTH_SECRET=super-secret-key-for-development-only-12345
NEXTAUTH_URL=http://localhost:3000

# Security - JWT dla autoryzacji
JWT_SECRET=0c6bb7dd493f701509b3dbad5587525d21dae35b5571f6f22fec816aa7f6a0cc

# Environment
NODE_ENV=${nodeEnv}
`;

fs.writeFileSync('.env.local', envContent);
console.log(`✅ Environment configured for ${currentBranch} branch`);
console.log(`📊 Database: ${databaseUrl.substring(0, 50)}...`);
console.log(`🌍 Environment: ${nodeEnv}`);
