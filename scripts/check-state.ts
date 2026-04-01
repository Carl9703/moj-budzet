import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Current Envelopes State ---')
    const envelopes = await prisma.envelope.findMany({
        where: { isArchived: false },
        orderBy: { name: 'asc' }
    })

    envelopes.forEach(e => {
        console.log(`Name: ${e.name.padEnd(30)} | Type: ${e.type.padEnd(8)} | EnvType: ${(e.envelopeType || 'NULL').padEnd(10)} | Amt: ${e.currentAmount.toFixed(2).padStart(10)} | Acc: ${e.isAccumulating}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
