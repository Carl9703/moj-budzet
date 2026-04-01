'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export default function Template({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99, filter: 'blur(5px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.99, filter: 'blur(5px)' }}
            transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1] // Custom ease-out curve for premium feel
            }}
            className="w-full h-full min-h-screen"
        >
            {children}
        </motion.div>
    )
}
