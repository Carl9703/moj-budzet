/**
 * Skrypt czyszczący dane od podanej daty do teraz.
 *
 * Co usuwa:
 *  1. Transakcje (Transaction) od FROM_DATE do teraz
 *  2. FxLoty (FxLot) od FROM_DATE do teraz
 *  3. Resetuje currentAmount wszystkich kopert do 0
 *
 * Uruchomienie:
 *   npx tsx scripts/cleanup-from-date.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Załaduj .env.local ręcznie (tak jak robią inne skrypty)
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const parsed = dotenv.parse(envContent)
    for (const [key, value] of Object.entries(parsed)) {
        if (!process.env[key]) process.env[key] = value
    }
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FROM_DATE = new Date('2026-03-01T00:00:00.000Z')
const TARGET_EMAIL = 'demo@example.com' // ustaw null aby czyścić wszystkich użytkowników

async function main() {
    console.log(`\n🗑️  Czyszczenie danych od ${FROM_DATE.toISOString().split('T')[0]} do teraz...`)
    if (TARGET_EMAIL) console.log(`👤 Tylko konto: ${TARGET_EMAIL}\n`)

    const users = await prisma.user.findMany({
        where: TARGET_EMAIL ? { email: TARGET_EMAIL } : {},
        select: { id: true, email: true }
    })
    console.log(`Znaleziono ${users.length} użytkownik(ów):`)
    users.forEach(u => console.log(`  - ${u.email} (${u.id})`))
    console.log()

    for (const user of users) {
        console.log(`\n👤 Użytkownik: ${user.email}`)

        // 1. Usuń transakcje
        const deletedTx = await prisma.transaction.deleteMany({
            where: {
                userId: user.id,
                date: { gte: FROM_DATE }
            }
        })
        console.log(`  ✅ Usunięto transakcji: ${deletedTx.count}`)

        // 2. Usuń FxLoty
        const deletedFx = await prisma.fxLot.deleteMany({
            where: {
                userId: user.id,
                date: { gte: FROM_DATE }
            }
        })
        console.log(`  ✅ Usunięto FxLotów: ${deletedFx.count}`)

        // 3. Reset sald kopert do 0
        const resetEnvelopes = await prisma.envelope.updateMany({
            where: { userId: user.id },
            data: { currentAmount: 0 }
        })
        console.log(`  ✅ Zresetowano sald kopert: ${resetEnvelopes.count}`)
    }

    console.log('\n✨ Gotowe!\n')
}

main()
    .catch((e) => {
        console.error('❌ Błąd:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
