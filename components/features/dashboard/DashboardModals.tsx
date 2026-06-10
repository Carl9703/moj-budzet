import { IncomeModal } from '@/components/shared/modals/IncomeModal'
import { ExpenseModal } from '@/components/shared/modals/ExpenseModal'
import { TransferModal } from '@/components/shared/modals/TransferModal'
import { EnvelopeTransactionsModal } from '@/components/shared/modals/EnvelopeTransactionsModal'
import { SavingsBreakdownModal } from '@/components/features/dashboard/modals/SavingsBreakdownModal'
import { ExchangeModal } from '@/components/shared/modals/ExchangeModal'

interface Props {
    activeModal: string | null
    closeModal: () => void
    data: any
    refetch: () => void
    handleIncomeSave: any
    handleExpenseSave: any
    handleTransferSave: any
    selectedEnvelope: any
    exchangeEnvelope: any
    emergencyFund: number
    goalEnvelopes: any[]
}

import { useMemo, memo } from 'react'

export const DashboardModals = memo(function DashboardModals({
    activeModal, closeModal, data, refetch, handleIncomeSave, handleExpenseSave, handleTransferSave,
    selectedEnvelope, exchangeEnvelope, emergencyFund, goalEnvelopes
}: Props) {
    const combinedEnvelopes = useMemo(() => {
        if (!data) return []
        return [
            ...(data.monthlyEnvelopes || []).map((e: any) => ({ ...e, type: 'monthly', currentAmount: e.current })),
            ...(data.yearlyEnvelopes || []).map((e: any) => ({ ...e, type: 'yearly', currentAmount: e.current }))
        ]
    }, [data])

    if (!activeModal) return null

    return (
        <>
            {activeModal === 'income' && (
                <IncomeModal onClose={closeModal} onSave={handleIncomeSave} />
            )}
            {activeModal === 'expense' && (
                <ExpenseModal
                    onClose={closeModal}
                    onSave={handleExpenseSave}
                    envelopes={combinedEnvelopes}
                />
            )}
            {activeModal === 'envelopeTransactions' && selectedEnvelope && (
                <EnvelopeTransactionsModal
                    isOpen={true}
                    onClose={closeModal}
                    envelopeId={selectedEnvelope.id}
                    envelopeName={selectedEnvelope.name}
                    envelopeIcon={selectedEnvelope.icon}
                />
            )}
            {activeModal === 'transfer' && (
                <TransferModal
                    onClose={closeModal}
                    onSave={handleTransferSave}
                    mainBalance={data.balance}
                    envelopes={combinedEnvelopes}
                />
            )}
            {activeModal === 'savings' && (
                <SavingsBreakdownModal
                    isOpen={true}
                    onClose={closeModal}
                    emergencyFund={emergencyFund}
                    goalsAmount={data.goalFundsAmount || 0}
                    goalEnvelopes={goalEnvelopes}
                />
            )}
            {activeModal === 'exchange' && exchangeEnvelope && (
                <ExchangeModal
                    envelopeId={exchangeEnvelope.id}
                    envelopeName={exchangeEnvelope.name}
                    envelopeBalance={exchangeEnvelope.balance}
                    onClose={closeModal}
                    onSave={refetch}
                />
            )}
        </>
    )
})
