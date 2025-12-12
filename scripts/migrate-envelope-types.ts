// Migration script to update existing envelopes with proper envelopeType
// Run this script once after deploying: npx ts-node scripts/migrate-envelope-types.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const LEGACY_ENVELOPE_TYPE_MAP: Record<string, string> = {
    'Budowanie Przyszłości': 'savings',
    'Fundusz Awaryjny': 'emergency',
    'Wesele': 'goal',
    'Wakacje': 'goal',
    'Podróże': 'goal',
    'Prezenty i Okazje': 'goal',
    'Auto: Serwis i Ubezpieczenie': 'goal',
    'Cele finansowe': 'goal',
    'Wolne środki (roczne)': 'goal',
}

async function migrateEnvelopeTypes() {
    console.log('🚀 Starting envelope type migration...')

    // Get all envelopes
    const envelopes = await prisma.envelope.findMany()
    console.log(`Found ${envelopes.length} envelopes to check`)

    let updated = 0
    for (const envelope of envelopes) {
        const newType = LEGACY_ENVELOPE_TYPE_MAP[envelope.name]

        // Only update if we have a mapping and it's different from current
        if (newType && envelope.envelopeType !== newType) {
            await prisma.envelope.update({
                where: { id: envelope.id },
                data: { envelopeType: newType }
            })
            console.log(`✅ Updated "${envelope.name}": ${envelope.envelopeType || 'budget'} → ${newType}`)
            updated++
        }
    }

    console.log(`\n✨ Migration complete! Updated ${updated} envelopes.`)
    console.log('Note: Envelopes not in the mapping keep their default "budget" type.')
}

migrateEnvelopeTypes()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
