import { motion } from 'motion/react';

interface SearchProgressBarProps {
  isSearching: boolean;
}

export function SearchProgressBar({ isSearching }: SearchProgressBarProps) {
  if (!isSearching) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#1E1F20]">
      <motion.div
        className="h-full bg-gradient-to-r from-white via-white to-[#E0E0E0] shadow-lg shadow-white/30"
        initial={{ width: '0%' }}
        animate={{ 
          width: ['0%', '60%', '90%'],
          opacity: [1, 1, 0.9]
        }}
        transition={{ 
          duration: 3.5,
          times: [0, 0.6, 1],
          ease: 'easeOut'
        }}
      />
    </div>
  );
}