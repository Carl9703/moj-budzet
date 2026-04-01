/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const { execSync } = require('child_process');

// Załaduj .env.local jeśli istnieje (dla lokalnego developmentu)
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        // Nie nadpisuj zmiennych środowiskowych, które już są ustawione (np. z Vercel)
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value.trim();
        }
      }
    }
  }
}

// Upewnij się, że DATABASE_URL jest ustawione
if (!process.env.DATABASE_URL) {
  // Sprawdź czy jest DATABASE_URL_MAIN lub DATABASE_URL_DEV
  const isMain = process.env.VERCEL_GIT_COMMIT_REF === 'main' ||
    process.env.VERCEL_GIT_COMMIT_REF === 'master' ||
    (!process.env.VERCEL_GIT_COMMIT_REF && process.env.NODE_ENV === 'production');

  if (isMain) {
    // Na Vercel używamy DATABASE_URL_MAIN bezpośrednio
    process.env.DATABASE_URL = process.env.DATABASE_URL_MAIN || process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
  }
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');
console.log(`📊 Database: ${process.env.DATABASE_URL.substring(0, 50)}...`);

// Uruchom prisma db push (dla istniejącej bazy produkcyjnej)
// db push synchronizuje schemat bez potrzeby baseline migracji
// Jeśli schemat nie zmienił się, to nie ma potrzeby synchronizacji
try {
  console.log('🔄 Running prisma db push...');
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    stdio: 'inherit',
    env: process.env
  });
  console.log('✅ Database schema synchronized successfully');
} catch (error) {
  console.error('❌ Database sync failed:', error.message);
  console.error('⚠️  This may be due to:');
  console.error('   1. Database endpoint not accessible');
  console.error('   2. Schema already synchronized');
  console.error('   3. Network issues during build');
  console.error('⚠️  Continuing build - Prisma Client will be generated anyway');
  // Nie przerywaj builda - Prisma Client będzie wygenerowany przez postinstall
  // Migracje można wykonać ręcznie później jeśli potrzeba
}

