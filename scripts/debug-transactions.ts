
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    const start = new Date('2025-12-01')
    const end = new Date('2025-12-31T23:59:59')

    const transactions = await prisma.transaction.findMany({
        where: {
            date: {
                gte: start,
                lte: end
            }
        },
        include: {
            envelope: true
        }
    })

    let output = `Found transactions: ${transactions.length}\n`
    transactions.forEach(t => {
        output += `ID: ${t.id} | Date: ${t.date.toISOString().split('T')[0]} | Amount: ${t.amount} | Desc: ${t.description} | Category: '${t.category}' | Envelope: ${t.envelope?.name}\n`
    })

    fs.writeFileSync('scripts/debug-output.txt', output)
    console.log('Output written to scripts/debug-output.txt')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
