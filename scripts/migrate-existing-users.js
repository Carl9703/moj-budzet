// Migration script: Add authentication fields to existing users
// This script safely migrates existing users to the new auth system

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function migrateExistingUsers() {
    console.log('🔄 Starting user migration...')
    
    try {
        // 1. Find all users without hashedPassword (old users)
        const existingUsers = await prisma.user.findMany({
            where: {
                hashedPassword: null
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        })

        console.log(`📊 Found ${existingUsers.length} existing users to migrate`)

        if (existingUsers.length === 0) {
            console.log('✅ No users need migration')
            return
        }

        // 2. Generate a temporary password hash
        // Users will need to reset their passwords
        const tempPassword = 'TempPassword123!'
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10)

        // 3. Update each user with new auth fields
        for (const user of existingUsers) {
            console.log(`🔄 Migrating user: ${user.email}`)
            
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    hashedPassword: hashedTempPassword,
                    role: 'USER',
                    updatedAt: new Date(),
                    isActive: true,
                    loginAttempts: 0,
                    lastLoginAt: null,
                    lockedUntil: null,
                    emailVerified: null,
                    image: null
                }
            })
            
            console.log(`✅ Migrated: ${user.email}`)
        }

        console.log('🎉 Migration completed successfully!')
        console.log('')
        console.log('📧 IMPORTANT: Inform your users that they need to:')
        console.log('1. Go to the login page')
        console.log('2. Use their existing email address')
        console.log(`3. Use temporary password: ${tempPassword}`)
        console.log('4. Change their password after first login')
        console.log('')
        console.log('Or they can register as new users if they prefer.')

    } catch (error) {
        console.error('❌ Migration failed:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run migration
if (require.main === module) {
    migrateExistingUsers()
        .then(() => {
            console.log('✅ Migration script completed')
            process.exit(0)
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error)
            process.exit(1)
        })
}

module.exports = { migrateExistingUsers }
