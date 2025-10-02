// Create a proper demo user with sample data
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createDemoUser() {
    try {
        console.log('🎭 Creating demo user with sample data...')
        
        // Check if demo user already exists
        const existingDemo = await prisma.user.findUnique({
            where: { email: 'demo@example.com' }
        })

        if (existingDemo) {
            console.log('🔄 Demo user exists, updating with sample data...')
            
            // Delete existing demo data
            await prisma.transaction.deleteMany({
                where: { userId: existingDemo.id }
            })
            
            await prisma.envelope.deleteMany({
                where: { userId: existingDemo.id }
            })
            
            await prisma.userConfig.deleteMany({
                where: { userId: existingDemo.id }
            })
        } else {
            console.log('➕ Creating new demo user...')
            
            const hashedPassword = await bcrypt.hash('demo123', 10)
            
            const demoUser = await prisma.user.create({
                data: {
                    id: 'demo-user-id',
                    email: 'demo@example.com',
                    name: 'Demo User',
                    hashedPassword: hashedPassword,
                    role: 'USER',
                    isActive: true,
                    createdAt: new Date('2025-01-01'),
                    updatedAt: new Date()
                }
            })
            
            console.log('✅ Demo user created')
        }

        const demoUserId = existingDemo?.id || 'demo-user-id'

        // Create demo envelopes with realistic amounts
        const demoEnvelopes = [
            // Monthly envelopes with some money spent
            { name: 'Jedzenie', icon: '🍔', type: 'monthly', planned: 1200, current: 850 },
            { name: 'Transport', icon: '🚗', type: 'monthly', planned: 400, current: 250 },
            { name: 'Rozrywka', icon: '🎮', type: 'monthly', planned: 300, current: 180 },
            { name: 'Higiena/Zdrowie', icon: '💊', type: 'monthly', planned: 200, current: 120 },
            { name: 'Ubrania', icon: '👕', type: 'monthly', planned: 200, current: 200 },
            { name: 'Dom', icon: '🏠', type: 'monthly', planned: 300, current: 150 },
            { name: 'Telekom/Subskrypcje', icon: '📱', type: 'monthly', planned: 150, current: 50 },
            { name: 'Nieprzewidziane', icon: '⚠️', type: 'monthly', planned: 250, current: 250 },
            
            // Yearly envelopes with progress
            { name: 'Wesele', icon: '💍', type: 'yearly', planned: 24000, current: 4500 },
            { name: 'Wakacje', icon: '✈️', type: 'yearly', planned: 5040, current: 1500 },
            { name: 'Prezenty', icon: '🎁', type: 'yearly', planned: 800, current: 200 },
            { name: 'OC', icon: '📋', type: 'yearly', planned: 600, current: 240 },
            { name: 'Święta', icon: '🎄', type: 'yearly', planned: 1000, current: 450 }
        ]

        for (const env of demoEnvelopes) {
            await prisma.envelope.create({
                data: {
                    userId: demoUserId,
                    name: env.name,
                    icon: env.icon,
                    type: env.type,
                    plannedAmount: env.planned,
                    currentAmount: env.current
                }
            })
        }

        console.log('📦 Created demo envelopes')

        // Create demo transactions (last 3 months)
        const demoTransactions = [
            // September 2024
            { type: 'income', amount: 5000, description: 'Wypłata - wrzesień', date: '2024-09-01', envelope: null },
            { type: 'expense', amount: 350, description: 'Zakupy spożywcze', date: '2024-09-03', envelope: 'Jedzenie' },
            { type: 'expense', amount: 120, description: 'Tankowanie', date: '2024-09-05', envelope: 'Transport' },
            { type: 'expense', amount: 80, description: 'Kino', date: '2024-09-10', envelope: 'Rozrywka' },
            { type: 'expense', amount: 200, description: 'Lekarz', date: '2024-09-15', envelope: 'Higiena/Zdrowie' },
            
            // October 2024
            { type: 'income', amount: 5000, description: 'Wypłata - październik', date: '2024-10-01', envelope: null },
            { type: 'expense', amount: 400, description: 'Zakupy spożywcze', date: '2024-10-02', envelope: 'Jedzenie' },
            { type: 'expense', amount: 150, description: 'Tankowanie', date: '2024-10-05', envelope: 'Transport' },
            { type: 'expense', amount: 120, description: 'Restauracja', date: '2024-10-12', envelope: 'Rozrywka' },
            { type: 'expense', amount: 300, description: 'Buty', date: '2024-10-20', envelope: 'Ubrania' },
            
            // November 2024 (current month)
            { type: 'income', amount: 5000, description: 'Wypłata - listopad', date: '2024-11-01', envelope: null },
            { type: 'expense', amount: 250, description: 'Zakupy spożywcze', date: '2024-11-03', envelope: 'Jedzenie' },
            { type: 'expense', amount: 100, description: 'Tankowanie', date: '2024-11-05', envelope: 'Transport' },
            { type: 'expense', amount: 60, description: 'Netflix', date: '2024-11-10', envelope: 'Telekom/Subskrypcje' }
        ]

        for (const tx of demoTransactions) {
            let envelopeId = null
            if (tx.envelope) {
                const envelope = await prisma.envelope.findFirst({
                    where: { 
                        userId: demoUserId,
                        name: tx.envelope
                    }
                })
                envelopeId = envelope?.id
            }

            await prisma.transaction.create({
                data: {
                    userId: demoUserId,
                    type: tx.type,
                    amount: tx.amount,
                    description: tx.description,
                    date: new Date(tx.date),
                    envelopeId: envelopeId,
                    includeInStats: true
                }
            })
        }

        console.log('💰 Created demo transactions')

        // Create demo user config
        await prisma.userConfig.create({
            data: {
                userId: demoUserId,
                defaultSalary: 5000,
                defaultToJoint: 1000,
                defaultToSavings: 500,
                defaultToVacation: 420,
                defaultToInvestment: 800
            }
        })

        console.log('⚙️ Created demo user config')
        console.log('')
        console.log('🎉 Demo user ready!')
        console.log('📧 Login: demo@example.com')
        console.log('🔑 Password: demo123')
        console.log('')
        console.log('✨ Demo user has:')
        console.log('   - Realistic envelope amounts')
        console.log('   - 3 months of transaction history')
        console.log('   - Configured salary and transfers')
        console.log('   - Ready for analytics and testing')

    } catch (error) {
        console.error('❌ Error creating demo user:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createDemoUser()
