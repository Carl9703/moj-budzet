import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

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
    const { name, icon, plannedAmount, group, isArchived } = body as {
      name?: string
      icon?: string | null
      plannedAmount?: number
      group?: string
      isArchived?: boolean
    }

    // Sprawdź czy koperta należy do użytkownika
    const envelope = await prisma.envelope.findFirst({
      where: {
        id: envelopeId,
        userId: userId
      }
    })

    if (!envelope) {
      return NextResponse.json({ error: 'Koperta nie znaleziona' }, { status: 404 })
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
        ...(isArchived !== undefined && { isArchived })
      }
    })

    return NextResponse.json({ success: true, envelope: updated })
  } catch (error) {
    console.error('Error updating envelope:', error)
    return NextResponse.json({ error: 'Błąd aktualizacji koperty' }, { status: 500 })
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
      return NextResponse.json({ error: 'Koperta nie znaleziona' }, { status: 404 })
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

      return NextResponse.json({
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

    return NextResponse.json({ success: true, message: 'Koperta została usunięta' })
  } catch (error) {
    console.error('Error deleting envelope:', error)
    return NextResponse.json({ error: 'Błąd usuwania koperty' }, { status: 500 })
  }
}

