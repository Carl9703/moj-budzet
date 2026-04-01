
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Simple env parser
function parseEnv(filePath: string) {
    if (!fs.existsSync(filePath)) return {}
    const content = fs.readFileSync(filePath, 'utf8')
    const res: Record<string, string> = {}
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (match) {
            let val = match[2] || ''
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1)
            }
            res[match[1]] = val
        }
    })
    return res
}

async function main() {
    const users = await prisma.user.findMany({
        include: {
            _count: {
                select: {
                    envelopes: true,
                    transactions: true,
                    sessions: true
                }
            }
        }
    })

    let output = '--- USERS FOUND ---\n'
    for (const u of users) {
        output += `User: ${u.email} (ID: ${u.id})\n`
        output += `  Name: ${u.name}\n`
        output += `  Envelopes: ${u._count.envelopes}\n`
        output += `  Transactions: ${u._count.transactions}\n`
        output += `  Sessions: ${u._count.sessions}\n`
        output += '-------------------\n'
    }

    const envLocal = parseEnv(path.join(process.cwd(), '.env.local'))
    const jwtSecret = envLocal['JWT_SECRET'] || process.env.JWT_SECRET

    if (jwtSecret) {
        output += `JWT_SECRET FOUND: yes\n`
        output += `JWT_SECRET VALUE: ${jwtSecret}\n`
    } else {
        output += 'JWT_SECRET NOT FOUND\n'
    }

    fs.writeFileSync('scripts/users-output.txt', output)
    console.log('Output written to scripts/users-output.txt')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
