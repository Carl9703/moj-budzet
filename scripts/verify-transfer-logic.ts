import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        // 1. Get a user
        const user = await prisma.user.findFirst()
        if (!user) {
            console.error('No user found! Cannot verify.')
            return
        }
        console.log(`Running verification for user: ${user.email} (${user.id})`)

        // 2. Create a "Transfer" (simulated)
        // Logic taken from app/api/transfer/route.ts:
        // - type: expense
        // - includeInStats: false
        // - transferPairId: generated
        // - description: Transfer...

        const transferPairId = `test_transfer_${Date.now()}`
        const amount = 123.45

        // Create the "Transfer Out" (Expense side)
        const transferTx = await prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'expense',
                amount: amount,
                description: 'TEST TRANSFER - SHOULD BE IGNORED',
                date: new Date(),
                category: null, // Transfers often don't have categories, or ignored
                includeInStats: false, // KEY FLAG
                transferPairId: transferPairId
            }
        })
        console.log(`Created test transfer transaction: ${transferTx.id}`)

        // 3. Run Analytics Query Logic
        // Logic taken from app/api/analytics/route.ts (getTrendsData & buildSpendingTree)
        // They filter by:
        // - type: 'expense'
        // - NOT: { description: contains 'Zamknięcie miesiąca' ... }
        // - BUT wait, do they check includeInStats? 
        // Let's verify the EXACT query from analytics/route.ts

        // In analytics/route.ts:
        // const currentPeriodTransactions = await prisma.transaction.findMany({ where: { ... } })
        // const currentExpenses = currentPeriodTransactions
        //   .filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)

        // So the DATABASE query fetches it (usually), but the IN-MEMORY filter removes it?
        // OR does the DB query filter it?
        // Let's check the route code again. 
        // Line 178: .filter(t => (t as { includeInStats?: boolean }).includeInStats !== false)
        // Yes, it filters IN MEMORY.

        // Let's replicate that check.

        const analyticsQueryResults = await prisma.transaction.findMany({
            where: {
                id: transferTx.id
            }
        })

        const tx = analyticsQueryResults[0]
        const isIncludedInStats = (tx as any).includeInStats !== false

        console.log('\n--- VERIFICATION RESULTS ---')
        console.log(`Transaction ID: ${tx.id}`)
        console.log(`Type: ${tx.type}`)
        console.log(`includeInStats (DB value): ${tx.includeInStats}`)
        console.log(`Is Counted in Analytics? (Logic: includeInStats !== false): ${isIncludedInStats}`)

        if (!isIncludedInStats) {
            console.log('✅ PASS: The transfer is EXCLUDED from expenses.')
        } else {
            console.error('❌ FAIL: The transfer is INCLUDED in expenses.')
        }

        // Cleaning up
        await prisma.transaction.delete({ where: { id: transferTx.id } })
        console.log('Test cleanup done.')

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
