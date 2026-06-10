import { useState, useCallback, useEffect } from 'react'

export function useDashboardModals() {
    const [activeModal, setActiveModal] = useState<string | null>(null)
    const [selectedEnvelope, setSelectedEnvelope] = useState<{ id: string, name: string, icon: string } | null>(null)
    const [exchangeEnvelope, setExchangeEnvelope] = useState<{ id: string; name: string; balance: number } | null>(null)

    const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
        // Skip if user is typing in an input or a modal is open
        const tag = (e.target as HTMLElement).tagName
        if (activeModal || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (e.metaKey || e.ctrlKey || e.altKey) return

        switch (e.key.toLowerCase()) {
            case 'n': setActiveModal('expense'); break
            case 'i': setActiveModal('income'); break
            case 't': setActiveModal('transfer'); break
        }
    }, [activeModal])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyboardShortcut)
        return () => document.removeEventListener('keydown', handleKeyboardShortcut)
    }, [handleKeyboardShortcut])

    return {
        activeModal,
        setActiveModal,
        selectedEnvelope,
        setSelectedEnvelope,
        exchangeEnvelope,
        setExchangeEnvelope,
        closeModal: () => setActiveModal(null)
    }
}
