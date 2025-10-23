const fs = require('fs');
const path = require('path');

// Sprawdź aktualną gałąź
const { execSync } = require('child_process');
const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();

console.log(`Current branch: ${currentBranch}`);

// Konfiguracja dla różnych środowisk
const envConfigs = {
  dev: {
    DATABASE_URL: process.env.DATABASE_URL_DEV || 'postgresql://neondb_owner:npg_apn5b9QFTrYG@ep-flat-sound-adj5s9vt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    NODE_ENV: 'development'
  },
  main: {
    DATABASE_URL: process.env.DATABASE_URL_MAIN || 'postgresql://neondb_owner:npg_apn5b9QFTrYG@ep-flat-sound-adj5s9vt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    NODE_ENV: 'production'
  },
  master: {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_apn5b9QFTrYG@ep-flat-sound-adj5s9vt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    NODE_ENV: 'production'
  }
};

// Wybierz konfigurację na podstawie gałęzi
const config = envConfigs[currentBranch] || envConfigs.dev;

// Sprawdź czy jesteśmy na produkcji (Vercel)
const isProduction = process.env.VERCEL === '1' || config.NODE_ENV === 'production';

// Stwórz plik .env.local
const envContent = `# Auto-generated environment file for ${currentBranch} branch
# Generated on: ${new Date().toISOString()}

# Database
DATABASE_URL=${config.DATABASE_URL}

# NextAuth
NEXTAUTH_SECRET=${isProduction ? process.env.NEXTAUTH_SECRET : 'super-secret-key-for-development-only-12345'}
NEXTAUTH_URL=${isProduction ? process.env.NEXTAUTH_URL : 'http://localhost:3000'}

# Security - JWT dla autoryzacji
JWT_SECRET=${isProduction ? process.env.JWT_SECRET : '0c6bb7dd493f701509b3dbad5587525d21dae35b5571f6f22fec816aa7f6a0cc'}

# Environment
NODE_ENV=${config.NODE_ENV}
`;

fs.writeFileSync('.env.local', envContent);
console.log(`✅ Environment configured for ${currentBranch} branch`);
console.log(`📊 Database: ${config.DATABASE_URL.substring(0, 50)}...`);
console.log(`🌍 Environment: ${config.NODE_ENV}`);
