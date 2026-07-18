import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function main() {
    const env = await prisma.envelope.findFirst({
        where: { name: { contains: 'podr', mode: 'insensitive' } }
    });
    
    if (!env) return;
    
    const txs = await prisma.transaction.findMany({
        where: { envelopeId: env.id },
        orderBy: { date: 'asc' }
    });
    console.log(`Transactions for ${env.name}:`);
    for (const tx of txs) {
        console.log(`[${tx.date.toISOString()}] ${tx.type} | Amt: ${tx.amount} | Desc: ${tx.description} | TransferPair: ${tx.transferPairId}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
