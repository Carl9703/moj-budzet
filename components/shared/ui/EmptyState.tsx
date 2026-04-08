import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, FileX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({ 
  title = "Brak danych", 
  description = "Brak danych do wyświetlenia dla wybranych kryteriów.", 
  icon: Icon = FileX,
  className = ""
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        flex flex-col items-center justify-center 
        p-8 md:p-12 
        bg-zinc-900/40 backdrop-blur-md 
        border border-zinc-700/30 rounded-2xl 
        text-center
        ${className}
      `}
    >
      <div className="w-16 h-16 mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 shadow-inner">
        <Icon className="w-8 h-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">
        {title}
      </h3>
      <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
