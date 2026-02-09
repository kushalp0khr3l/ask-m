import { motion, AnimatePresence } from 'motion/react';
import { WelcomeScreen } from './WelcomeScreen';
import { SearchResponse } from './SearchResponse';
import { useRef, useEffect } from 'react';
import { StreamingResponse } from './StreamingResponse';

interface MainContentProps {
  chatId: string | null;
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  activeSearchMode: 'exam' | 'guided';
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MainContent({ chatId, messages, setMessages, activeSearchMode, setIsSearching }: MainContentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto pb-32 md:pb-32 pt-16 md:pt-0 scrollbar-hide">
      <AnimatePresence mode="popLayout">
        {messages.length === 0 ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <WelcomeScreen />
          </motion.div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';

              if (isUser) {
                return (
                  <motion.div
                    key={`user-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto px-4 md:px-8 flex justify-end"
                  >
                    <div className="bg-[#2D2E30] rounded-2xl px-4 md:px-6 py-3 md:py-4 max-w-2xl border border-[#3D3E40]/30 shadow-sm">
                      <p className="text-white text-sm md:text-base leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                );
              }

              // Assistant Message
              return (
                <motion.div
                  key={`assistant-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <StreamingResponse
                    content={{
                      summary: msg.content,
                      sources: msg.metadata?.sources || []
                    }}
                    isComplete={true}
                    status={msg.metadata?.status}
                    confidence={msg.metadata?.confidence}
                    message={msg.metadata?.message}
                    matchedQuestion={msg.metadata?.matched_question}
                  />
                </motion.div>
              );
            })}

            {/* AI Generation Layer (Visible when waiting for response) */}
            {messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <motion.div
                key={`generation-${messages.length - 1}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <SearchResponse
                  chatId={chatId}
                  query={messages[messages.length - 1].content}
                  mode={activeSearchMode}
                  onAnswerComplete={(answerData) => {
                    // Safety check: only add if we haven't already added an assistant message for this
                    setMessages(prev => {
                      if (prev.length > 0 && prev[prev.length - 1].role === 'assistant') return prev;
                      return [...prev, {
                        role: 'assistant',
                        content: answerData.summary,
                        metadata: answerData
                      }];
                    });
                    setIsSearching(false);
                  }}
                />
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
