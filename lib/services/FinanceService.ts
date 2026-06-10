import { prisma } from '@/lib/utils/prisma'
import { SYSTEM_DESCRIPTIONS, DEFAULT_APP_START_DATE } from '@/lib/constants/system'
import { isEmergencyEnvelope, isGoalEnvelope } from '@/lib/constants/envelopeTypes'
import { toNum } from '@/lib/utils/decimal'
import { roundToCents } from '@/lib/utils/money'

export class FinanceService {
    /**
     * Calculates the raw balance from transactions (Income - Expenses)
     * excluding internal transfers.
     */
    static async getTransactionBalance(userId: string, tx?: any) {
        const client = tx || prisma
        const startOfAppUsage = new Date(DEFAULT_APP_START_DATE)

        const aggregations = await client.transaction.groupBy({
            by: ['type'],
            where: {
                userId,
                type: { in: ['income', 'expense'] },
                date: { gte: startOfAppUsage },
                transferPairId: null, // Wyklucz transfery wewnętrzne bezpośrednio w zapytaniu
                NOT: [
                    { description: { contains: SYSTEM_DESCRIPTIONS.BALANCE_TRANSFER } }
                ]
            },
            _sum: {
                amount: true
            }
        })

        let income = 0;
        let expenses = 0;

        for (const agg of aggregations) {
            const amountVal = agg._sum.amount ? toNum(agg._sum.amount) : 0;
            if (agg.type === 'income') {
                income = amountVal;
            } else if (agg.type === 'expense') {
                expenses = amountVal;
            }
        }

        income = roundToCents(income);
        expenses = roundToCents(expenses);

        return { income, expenses, net: roundToCents(income - expenses) }
    }

    /**
     * Calculates the main balance surplus (unassigned funds in main account)
     * Net Balance - Emergency Fund - Goal Funds
     */
    static async getMainBalanceSurplus(userId: string, tx?: any) {
        const client = tx || prisma
        const { net } = await this.getTransactionBalance(userId, client)

        // Emergency Fund
        const emergencyFundEnvelopes = await client.envelope.findMany({
            where: { userId, envelopeType: 'emergency', isArchived: false }
        })
        const emergencyFundAmount = emergencyFundEnvelopes.reduce((sum: number, e: any) => sum + toNum(e.currentAmount), 0)

        // Goal Funds — filtrowanie po envelopeType zamiast nazw
        const envelopes = await this.getActiveEnvelopes(userId, client)
        const goalFundsAmount = envelopes
            .filter((e: any) =>
                isGoalEnvelope(e.envelopeType, e.name) &&
                !isEmergencyEnvelope(e.envelopeType, e.name)
            )
            .reduce((sum: number, e: any) => sum + toNum(e.currentAmount), 0)

        return roundToCents(net - emergencyFundAmount - goalFundsAmount)
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
