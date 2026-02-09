import { WelcomeScreen } from './WelcomeScreen';
import { SearchResponse } from './SearchResponse';
import { StreamingResponse } from './StreamingResponse';
import { useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';

interface MainContentProps {
  chatId: string | null;
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  activeSearchMode: 'exam' | 'guided';
  onQuickStart: (query: string) => void;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MainContent({ chatId, messages, setMessages, activeSearchMode, onQuickStart, setIsSearching }: MainContentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Show button if we are more than 100px away from bottom
    const isDistanceFromBottom = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollButton(isDistanceFromBottom);
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto pb-32 md:pb-32 pt-16 md:pt-0 scrollbar-hide relative"
    >
      {messages.length === 0 ? (
        <WelcomeScreen onQuickStart={onQuickStart} />
      ) : (
        <div className="space-y-4 md:space-y-6">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';

            if (isUser) {
              return (
                <div
                  key={`user-${index}`}
                  className="max-w-4xl mx-auto px-4 md:px-8 flex justify-end"
                >
                  <div className="bg-[#2D2E30] rounded-2xl px-4 md:px-6 py-3 md:py-4 max-w-2xl border border-[#3D3E40]/30 shadow-sm">
                    <p className="text-white text-sm md:text-base leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            }

            // Assistant Message
            return (
              <div key={`assistant-${index}`}>
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
              </div>
            );
          })}

          {/* AI Generation Layer (Visible when waiting for response) */}
          {messages.length > 0 && messages[messages.length - 1].role === 'user' && (
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
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 bg-[#3D3E40] hover:bg-[#4D4E50] text-white p-3 rounded-full shadow-lg transition-all z-50 border border-[#4D4E50]"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
