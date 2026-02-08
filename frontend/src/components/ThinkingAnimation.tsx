import { motion } from 'motion/react';
import logoImage from '../assets/logo.jpg';

interface ThinkingAnimationProps {
  query?: string;
}

export function ThinkingAnimation({ query }: ThinkingAnimationProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-4 md:space-y-6">
      {/* Ask-M Thinking Response */}
      <motion.div
        className="bg-[#1E1F20] rounded-2xl md:rounded-3xl p-4 md:p-8 border border-[#2D2E30]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <motion.img
            src={logoImage}
            alt="Ask-M Logo"
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <span className="text-lg md:text-xl text-white">Ask-M</span>
        </div>

        {/* Thinking Message */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full shadow-sm shadow-white/50"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
            <span className="text-[#A0A0A0] text-sm">Searching knowledge base...</span>
          </div>

          {/* Skeleton loaders for content */}
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="flex gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15 }}
              >
                <span className="text-[#A0A0A0] mt-1 text-sm md:text-base">•</span>
                <div className="flex-1 space-y-2">
                  <motion.div
                    className="h-4 bg-[#2D2E30] rounded shadow-sm shadow-white/10"
                    animate={{ opacity: [0.5, 0.9, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: `${90 - i * 15}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Processing stages indicator */}
          <motion.div
            className="mt-8 pt-6 border-t border-[#2D2E30]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="space-y-3">
              {[
                { text: 'Analyzing syllabus references', delay: 0 },
                { text: 'Retrieving relevant documents', delay: 0.3 },
                { text: 'Processing OCR notes', delay: 0.6 },
              ].map((stage, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 text-xs text-[#A0A0A0]"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: stage.delay }}
                >
                  <motion.div
                    className="w-1.5 h-1.5 bg-white rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: stage.delay }}
                  />
                  {stage.text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}