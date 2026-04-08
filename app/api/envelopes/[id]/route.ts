import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { jsonResponse } from '@/lib/utils/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Pobierz userId z JWT tokenu
    let userId: string
    try {
      userId = await getUserIdFromToken(request)
    } catch (error) {
      return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
    }

    const { id: envelopeId } = await params
    const body = await request.json()
    const { name, icon, plannedAmount, group, isArchived, isAccumulating, type, currencyCode, parentEnvelopeId } = body as {
      name?: string
      icon?: string | null
      plannedAmount?: number
      group?: string
      isArchived?: boolean
      isAccumulating?: boolean
      type?: 'monthly' | 'yearly'
      currencyCode?: string
      parentEnvelopeId?: string | null
    }

    // Sprawdź czy koperta należy do użytkownika
    const envelope = await prisma.envelope.findFirst({
      where: {
        id: envelopeId,
        userId: userId
      }
    })

    if (!envelope) {
      return jsonResponse({ error: 'Koperta nie znaleziona' }, { status: 404 })
    }

    // Handle name change cascade separately before update if needed, or transactionally
    // If name is changing, we need to update all categories that reference this envelope name
    if (name && name !== envelope.name) {
      // Find categories linked to old name
      await prisma.category.updateMany({
        where: {
          userId: userId,
          defaultEnvelope: envelope.name
        },
        data: {
          defaultEnvelope: name
        }
      })
    }

    // Aktualizuj kopertę
    const updated = await prisma.envelope.update({
      where: {
        id: envelopeId
      },
      data: {
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(plannedAmount !== undefined && { plannedAmount }),
        ...(group !== undefined && { group }),
        ...(isArchived !== undefined && { isArchived }),
        ...(isAccumulating !== undefined && { isAccumulating }),
        ...(type !== undefined && { type }),
        ...(currencyCode !== undefined && { currencyCode }),
        ...(parentEnvelopeId !== undefined && { parentEnvelopeId })
      }
    })

    return jsonResponse({ success: true, envelope: updated })
  } catch (error) {
    console.error('Error updating envelope:', error)
    return jsonResponse({ error: 'Błąd aktualizacji koperty' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Pobierz userId z JWT tokenu
    let userId: string
    try {
      userId = await getUserIdFromToken(request)
    } catch (error) {
      return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
    }

    const { id: envelopeId } = await params

    // Sprawdź czy koperta należy do użytkownika
    const envelope = await prisma.envelope.findFirst({
      where: {
        id: envelopeId,
        userId: userId
      }
    })

    if (!envelope) {
      return jsonResponse({ error: 'Koperta nie znaleziona' }, { status: 404 })
    }

    // Sprawdź czy koperta ma transakcje
    const transactionsCount = await prisma.transaction.count({
      where: {
        envelopeId: envelopeId
      }
    })

    if (transactionsCount > 0) {
      // Jeśli koperta ma transakcje, zarchiwizuj ją zamiast usuwać
      const archived = await prisma.envelope.update({
        where: {
          id: envelopeId
        },
        data: {
          isArchived: true
        }
      })

      return jsonResponse({
        success: true,
        message: 'Koperta została zarchiwizowana (ma transakcje)',
        envelope: archived
      })
    }

    // Jeśli koperta nie ma transakcji, usuń ją
    await prisma.envelope.delete({
      where: {
        id: envelopeId
      }
    })

    return jsonResponse({ success: true, message: 'Koperta została usunięta' })
  } catch (error) {
    console.error('Error deleting envelope:', error)
    return jsonResponse({ error: 'Błąd usuwania koperty' }, { status: 500 })
  }
}

// GET endpoint to check if envelope can be deleted (for UI confirmation)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string
    try {
      userId = await getUserIdFromToken(request)
    } catch (error) {
      return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
    }

    const { id: envelopeId } = await params

    const envelope = await prisma.envelope.findFirst({
      where: {
        id: envelopeId,
        userId: userId
      }
    })

    if (!envelope) {
      return jsonResponse({ error: 'Koperta nie znaleziona' }, { status: 404 })
    }

    // Count transactions
    const transactionCount = await prisma.transaction.count({
      where: {
        envelopeId: envelopeId
      }
    })

    return jsonResponse({
      envelope,
      transactionCount,
      canDelete: transactionCount === 0,
      willArchive: transactionCount > 0
    })

  } catch (error) {
    return jsonResponse(
      { error: 'Błąd pobierania koperty' },
      { status: 500 }
    )
  }
}
