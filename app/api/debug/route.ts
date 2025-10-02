import { NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Sprawdzam zawartość bazy danych...')
    
    // Sprawdź wszystkich użytkowników
    const users = await prisma.user.findMany()
    console.log('👥 Users:', users)
    
    // Sprawdź wszystkie koperty
    const envelopes = await prisma.envelope.findMany()
    console.log('📦 Envelopes:', envelopes)
    
    // Sprawdź transakcje
    const transactions = await prisma.transaction.findMany({ take: 5 })
    console.log('💳 Transactions (first 5):', transactions)
    
    // Sprawdź konfigurację
    const configs = await prisma.userConfig.findMany()
    console.log('⚙️ Configs:', configs)
    
    return NextResponse.json({
      users: users.length,
      envelopes: envelopes.length,
      transactions: transactions.length,
      configs: configs.length,
      data: {
        users,
        envelopes: envelopes.slice(0, 10), // Pierwsze 10
        transactions: transactions.slice(0, 5), // Pierwsze 5
        configs
      }
    })
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
