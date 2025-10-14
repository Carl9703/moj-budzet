const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
    console.log('🔍 Sprawdzanie bazy danych...\n');
    
    try {
        // 1. Sprawdź wszystkich użytkowników
        console.log('👥 UŻYTKOWNICY:');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                _count: {
                    select: {
                        transactions: true,
                        envelopes: true
                    }
                }
            }
        });
        
        users.forEach(user => {
            console.log(`- ${user.email} (${user.name})`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Transakcje: ${user._count.transactions}`);
            console.log(`  Koperty: ${user._count.envelopes}`);
            console.log(`  Utworzony: ${user.createdAt.toISOString()}`);
            console.log('');
        });
        
        // 2. Sprawdź transakcje demo user
        const demoUser = users.find(u => u.email === 'demo@example.com');
        if (demoUser) {
            console.log('📊 TRANSAKCJE DEMO USER:');
            const demoTransactions = await prisma.transaction.findMany({
                where: { userId: demoUser.id },
                select: {
                    id: true,
                    type: true,
                    amount: true,
                    description: true,
                    date: true,
                    envelope: {
                        select: { name: true }
                    }
                },
                orderBy: { date: 'desc' },
                take: 10
            });
            
            if (demoTransactions.length === 0) {
                console.log('❌ Demo user nie ma transakcji');
            } else {
                console.log(`✅ Demo user ma ${demoTransactions.length} transakcji:`);
                demoTransactions.forEach(t => {
                    console.log(`  - ${t.type}: ${t.amount}zł (${t.description || 'brak opisu'}) - ${t.envelope?.name || 'brak koperty'}`);
                });
            }
        } else {
            console.log('❌ Demo user nie istnieje w bazie');
        }
        
        // 3. Sprawdź koperty demo user
        if (demoUser) {
            console.log('\n📁 KOPERTY DEMO USER:');
            const demoEnvelopes = await prisma.envelope.findMany({
                where: { userId: demoUser.id },
                select: {
                    name: true,
                    type: true,
                    plannedAmount: true,
                    currentAmount: true,
                    group: true
                }
            });
            
            if (demoEnvelopes.length === 0) {
                console.log('❌ Demo user nie ma kopert');
            } else {
                console.log(`✅ Demo user ma ${demoEnvelopes.length} kopert:`);
                demoEnvelopes.forEach(e => {
                    console.log(`  - ${e.name}: ${e.currentAmount}/${e.plannedAmount}zł (${e.type}, ${e.group})`);
                });
            }
        }
        
        // 4. Sprawdź czy są transakcje innych użytkowników
        console.log('\n🔒 BEZPIECZEŃSTWO - SPRAWDZENIE IZOLACJI:');
        const allTransactions = await prisma.transaction.findMany({
            select: {
                id: true,
                userId: true,
                type: true,
                amount: true,
                description: true,
                user: {
                    select: { email: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        
        console.log(`📈 Ostatnie 20 transakcji w systemie:`);
        allTransactions.forEach(t => {
            console.log(`  - ${t.user.email}: ${t.type} ${t.amount}zł (${t.description || 'brak opisu'})`);
        });
        
        // 5. Sprawdź czy demo user ma dostęp do innych danych
        if (demoUser) {
            console.log('\n🚨 SPRAWDZENIE DOSTĘPU DEMO USER:');
            
            // Sprawdź czy demo user może zobaczyć transakcje innych użytkowników
            const otherUsersTransactions = await prisma.transaction.findMany({
                where: {
                    userId: { not: demoUser.id }
                },
                select: {
                    id: true,
                    userId: true,
                    type: true,
                    amount: true,
                    user: {
                        select: { email: true }
                    }
                },
                take: 5
            });
            
            if (otherUsersTransactions.length > 0) {
                console.log('⚠️  UWAGA: W systemie są transakcje innych użytkowników:');
                otherUsersTransactions.forEach(t => {
                    console.log(`  - ${t.user.email}: ${t.type} ${t.amount}zł`);
                });
            } else {
                console.log('✅ W systemie nie ma transakcji innych użytkowników');
            }
        }
        
    } catch (error) {
        console.error('❌ Błąd podczas sprawdzania bazy:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
