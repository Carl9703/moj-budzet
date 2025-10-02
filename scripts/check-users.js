// Quick script to check current users in database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
    try {
        console.log('🔍 Checking current users in database...')
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                hashedPassword: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        console.log(`📊 Found ${users.length} users:`)
        console.log('')
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`)
            console.log(`   Name: ${user.name || 'No name'}`)
            console.log(`   Has Password: ${user.hashedPassword ? '✅ YES' : '❌ NO'}`)
            console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`)
            console.log('')
        })

        const usersNeedingMigration = users.filter(u => !u.hashedPassword)
        console.log(`🔄 Users needing migration: ${usersNeedingMigration.length}`)
        
        if (usersNeedingMigration.length > 0) {
            console.log('📝 These users need migration:')
            usersNeedingMigration.forEach(user => {
                console.log(`   - ${user.email}`)
            })
        }

    } catch (error) {
        console.error('❌ Error checking users:', error.message)
        
        if (error.code === 'P2021') {
            console.log('💡 The table "User" does not exist yet.')
            console.log('   This means the database schema needs to be applied first.')
            console.log('   Run: npx prisma db push')
        }
    } finally {
        await prisma.$disconnect()
    }
}

checkUsers()
