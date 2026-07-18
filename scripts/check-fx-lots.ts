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
    
    if (!env) { 
        console.log('Env not found'); 
        return; 
    }
    
    console.log('Envelope:', env.name, 'Balance:', env.currentAmount, 'Currency:', env.currencyCode);
    
    const lots = await prisma.fxLot.findMany({
        where: { envelopeId: env.id }
    });
    console.log(`Found ${lots.length} lots`);
    
    const totalRemaining = lots.reduce((sum, l) => sum + Number(l.remainingAmount), 0);
    console.log('Total FxLot Remaining:', totalRemaining);
    
    // Fix: if total remaining < current amount, create a synthetic FxLot
    const diff = Number(env.currentAmount) - totalRemaining;
    if (diff > 0) {
        console.log(`Missing FxLot for ${diff} ${env.currencyCode}. Creating synthetic lot...`);
        const syntheticPln = diff * 5.04;
        
        await prisma.fxLot.create({
            data: {
                userId: env.userId,
                envelopeId: env.id,
                date: new Date(),
                originalAmount: diff,
                remainingAmount: diff,
                costBasisPln: syntheticPln,
                exchangeRate: 5.04,
                foreignCurrency: env.currencyCode,
                sourceTransactionId: null
            }
        });
        console.log('Synthetic FxLot created successfully!');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
