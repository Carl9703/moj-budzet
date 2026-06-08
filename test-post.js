const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function run() {
    // Find the 'demo@example.com' user
    const user = await prisma.user.findUnique({
        where: { email: 'demo@example.com' }
    });

    if (!user) {
        console.log('User demo@example.com not found. Create it first by logging in as demo.');
        return;
    }

    let userConfig = await prisma.userConfig.findUnique({
        where: { userId: user.id }
    });
    
    if (!userConfig) {
        userConfig = await prisma.userConfig.create({
            data: { userId: user.id, defaultSalary: 0 }
        });
    }
    
    let token = userConfig.apiToken;
    if (!token) {
        token = crypto.randomUUID();
        await prisma.userConfig.update({
            where: { userId: user.id },
            data: { apiToken: token }
        });
    }
    
    console.log('Using Token for user demo@example.com:', token);
    
    const res = await fetch('https://quantumbudget.vercel.app/api/transactions/import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            amount: 45.99,
            description: 'BIEDRONKA WARSZAWA',
            date: new Date().toISOString(),
            currency: 'PLN',
            source: 'google_wallet',
            cardLastFour: '4589'
        })
    });
    
    const json = await res.json();
    console.log('Response:', json);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
