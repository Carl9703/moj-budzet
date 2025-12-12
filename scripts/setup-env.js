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

// Pobierz wartości ze zmiennych środowiskowych
const databaseUrl = currentBranch === 'dev'
  ? process.env.DATABASE_URL_DEV
  : process.env.DATABASE_URL;

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const jwtSecret = process.env.JWT_SECRET;
const nodeEnv = currentBranch === 'dev' ? 'development' : 'production';

// Walidacja wymaganych zmiennych
const missingVars = [];
if (!databaseUrl) missingVars.push(currentBranch === 'dev' ? 'DATABASE_URL_DEV' : 'DATABASE_URL');
if (!nextAuthSecret) missingVars.push('NEXTAUTH_SECRET');
if (!jwtSecret) missingVars.push('JWT_SECRET');

if (missingVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these variables in your environment or .env file.');
  // Wstrzymaj tylko jeśli to strict mode lub produkcja, w dev pozwól (choć aplikacja może nie działać)
  // Ale skoro usuwamy hardcoded secrets, to musimy wymagać ich podania.
  // Dla ułatwienia lokalnego developmentu, jeśli plik .env istnieje, to script setup-env go nie nadpisze sekretami, 
  // ale utworzy .env.local na podstawie .env.

  // UWAGA: Ten skrypt ma generować .env.local. Jeśli nie ma zmiennych w process.env, to nie ma z czego generować.
  if (process.env.CI) {
    process.exit(1);
  } else {
    console.warn('⚠️  Running in local mode without all secrets. App might not work correctly.');
  }
}

// Stwórz plik .env.local
const envContent = `# Auto-generated environment file for ${currentBranch} branch
# Generated on: ${new Date().toISOString()}

# Database URLs for different branches
DATABASE_URL=${databaseUrl || ''}

# NextAuth
NEXTAUTH_SECRET=${nextAuthSecret || ''}
NEXTAUTH_URL=${nextAuthUrl}

# Security - JWT dla autoryzacji
JWT_SECRET=${jwtSecret || ''}

# Environment
NODE_ENV=${nodeEnv}
`;

// UWAGA: Zakomentowane - nie nadpisuj .env.local przy każdym uruchomieniu
// Ręcznie skonfiguruj .env.local z poprawnymi wartościami DATABASE_URL, NEXTAUTH_SECRET, JWT_SECRET
// fs.writeFileSync('.env.local', envContent);
console.log(`✅ Environment configured for ${currentBranch} branch (bez nadpisywania .env.local)`);
if (databaseUrl) console.log(`📊 Database: ${databaseUrl.substring(0, 50)}...`);
console.log(`🌍 Environment: ${nodeEnv}`);
