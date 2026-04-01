import { prisma } from '@/lib/utils/prisma'
import { SYSTEM_DESCRIPTIONS, DEFAULT_APP_START_DATE } from '@/lib/constants/system'
import { isEmergencyEnvelope, isGoalEnvelope } from '@/lib/constants/envelopeTypes'

export class FinanceService {
    /**
     * Calculates the raw balance from transactions (Income - Expenses)
     * excluding internal transfers.
     */
    static async getTransactionBalance(userId: string, tx?: any) {
        const client = tx || prisma
        const startOfAppUsage = new Date(DEFAULT_APP_START_DATE)

        const allTransactions = await client.transaction.findMany({
            where: {
                userId,
                type: { in: ['income', 'expense'] },
                date: { gte: startOfAppUsage },
                NOT: [
                    { description: { contains: SYSTEM_DESCRIPTIONS.MONTH_CLOSE } },
                    { description: { contains: SYSTEM_DESCRIPTIONS.BALANCE_TRANSFER } }
                ]
            }
        })

        const income = Math.round(allTransactions
            .filter((t: any) => {
                const hasTransferPairId = !!(t as any).transferPairId
                return t.type === 'income' && !hasTransferPairId
            })
            .reduce((sum: number, t: any) => sum + t.amount, 0) * 100) / 100

        const expenses = Math.round(allTransactions
            .filter((t: any) => {
                const hasTransferPairId = !!(t as any).transferPairId
                return t.type === 'expense' && !hasTransferPairId
            })
            .reduce((sum: number, t: any) => sum + t.amount, 0) * 100) / 100

        return { income, expenses, net: Math.round((income - expenses) * 100) / 100 }
    }

    /**
     * Calculates the main balance surplus (unassigned funds in main account)
     * Net Balance - Emergency Fund - Goal Funds
     */
    static async getMainBalanceSurplus(userId: string, tx?: any) {
        const client = tx || prisma
        const { net } = await this.getTransactionBalance(userId, client)

        // Emergency Fund
        const emergencyFundEnvelope = await client.envelope.findFirst({
            where: { userId, envelopeType: 'emergency', isArchived: false }
        })
        const emergencyFundAmount = emergencyFundEnvelope ? emergencyFundEnvelope.currentAmount : 0

        // Goal Funds — filtrowanie po envelopeType zamiast nazw
        const envelopes = await this.getActiveEnvelopes(userId, client)
        const goalFundsAmount = envelopes
            .filter((e: any) =>
                isGoalEnvelope(e.envelopeType, e.name) &&
                !isEmergencyEnvelope(e.envelopeType, e.name)
            )
            .reduce((sum: number, e: any) => sum + e.currentAmount, 0)

        return Math.round((net - emergencyFundAmount - goalFundsAmount) * 100) / 100
    }

    /**
     * Gets all non-archived envelopes for a user
     */
    static async getActiveEnvelopes(userId: string, tx?: any) {
        const client = tx || prisma
        return client.envelope.findMany({
            where: { userId, isArchived: false },
            orderBy: { name: 'asc' }
        })
    }
}
