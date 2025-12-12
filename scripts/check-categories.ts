
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const count = await prisma.category.count()
        console.log(`Liczba wszystkich kategorii w bazie: ${count}`)

        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: { categories: true }
                }
            }
        })

        users.forEach(u => {
            console.log(`Użytkownik ${u.email}: ${u._count.categories} kategorii`)
        })

    } catch (e) {
        console.error('Błąd:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
