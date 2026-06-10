import { useMemo } from 'react'
import { isFreeFundsEnvelope, isEmergencyEnvelope, isSavingsEnvelope } from '@/lib/constants/envelopeTypes'

export function useGroupedEnvelopes(data: any) {
    return useMemo(() => {
        if (!data) return { needs: [], lifestyle: [], assets: [], goals: [] }

        // Needs
        const needsMonthly = (data.monthlyEnvelopes || [])
            .filter((e: any) => e.group === 'needs' && !e.isAccumulating)
            .map((e: any) => ({ ...e, envelopeType: 'monthly' as const, envelopeKind: e.envelopeType }))
        const needsYearly = (data.yearlyEnvelopes || [])
            .filter((e: any) => e.group === 'needs' && !e.isAccumulating)
            .map((e: any) => ({ ...e, envelopeType: 'yearly' as const, envelopeKind: e.envelopeType }))
        const needs = [...needsMonthly, ...needsYearly]

        // Lifestyle / Wants
        const wantsMonthly = (data.monthlyEnvelopes || [])
            .filter((e: any) => (e.group === 'wants' || e.group === 'lifestyle') && !e.isAccumulating)
            .map((e: any) => ({ ...e, envelopeType: 'monthly' as const, envelopeKind: e.envelopeType }))
        const wantsYearly = (data.yearlyEnvelopes || [])
            .filter((e: any) => (e.group === 'wants' || e.group === 'lifestyle') && !e.isAccumulating)
            .map((e: any) => ({ ...e, envelopeType: 'yearly' as const, envelopeKind: e.envelopeType }))
        const lifestyle = [...wantsMonthly, ...wantsYearly]

        // Assets
        const assetsMonthly = (data.monthlyEnvelopes || [])
            .filter((e: any) => (e.group === 'assets' || (e.isAccumulating && e.group !== 'goals')) && !isEmergencyEnvelope(e.envelopeType, e.name))
            .map((e: any) => ({ ...e, envelopeType: 'monthly' as const, envelopeKind: e.envelopeType }))
        const assetsYearly = (data.yearlyEnvelopes || [])
            .filter((e: any) => {
                return (e.group === 'assets' || (e.isAccumulating && e.group !== 'goals')) &&
                    !isFreeFundsEnvelope(e.envelopeType, e.name) &&
                    !isEmergencyEnvelope(e.envelopeType, e.name)
            })
            .map((e: any) => ({ ...e, envelopeType: 'yearly' as const, envelopeKind: e.envelopeType }))
        const assets = [...assetsMonthly, ...assetsYearly]

        // Saving Goals
        const goals = (data.yearlyEnvelopes || [])
            .filter((e: any) => e.group === 'goals')
            .map((e: any) => ({ ...e, envelopeType: 'yearly' as const, envelopeKind: e.envelopeType }))

        return { needs, lifestyle, assets, goals }
    }, [data])
}
