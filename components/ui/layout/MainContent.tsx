'use client'

import { ReactNode, useState, useEffect } from 'react'

interface MainContentProps {
    children: ReactNode
}

export function MainContent({ children }: MainContentProps) {
    return (
        <main className="bg-zinc-950 relative flex-1 overflow-auto min-h-screen transition-all duration-300 ml-0 p-4 pb-24 md:ml-64 md:px-8 md:pb-8 md:pt-2">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-amber-500/[0.02] rounded-full blur-[100px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-amber-700/[0.02] rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10">
                {children}
            </div>
        </main>
    )
}
