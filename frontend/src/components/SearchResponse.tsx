import { useState, useEffect, useRef } from 'react';
import { BookOpen, FileText, ImageIcon, ExternalLink } from 'lucide-react';
import { ThinkingAnimation } from './ThinkingAnimation';
import { StreamingResponse } from './StreamingResponse';
import { supabase } from '../lib/supabaseClient';

interface SearchResponseProps {
  chatId: string | null;
  query: string;
  mode: 'exam' | 'guided';
  onAnswerComplete?: (data: any) => void;
}

// Mock AI response generator (kept for fallback structure reference if needed)
const generateResponse = (query: string) => {
  return {};
};

export function SearchResponse({ chatId, query, mode, onAnswerComplete }: SearchResponseProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const isCompletedRef = useRef(false);
  const timerRef = useRef<any>(null);
  const modeRef = useRef(mode); // Ref to always hold the latest mode value

  // Keep modeRef in sync with the mode prop
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const fetchResponse = async (forceInference = false) => {
    setIsLoading(true);
    setIsStreaming(false);
    isCompletedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!forceInference) {
      setResponseData(null);
    }

    // Capture the current mode at fetch time
    const currentMode = modeRef.current;

    try {
      const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const backendUrl = rawBackendUrl.replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: query,
          mode: currentMode,
          enable_inference: forceInference
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch answer');

      const data = await response.json();

      const formattedData = {
        summary: data.answer || data.message || '',
        sources: [
          {
            type: (data.status && data.status.includes('cache')) ? 'syllabus' : 'document',
            title: data.matched_question || 'AI Analysis',
            subtitle: data.subject ? `${data.subject} - ${data.marks} marks` : 'General Response',
            icon: 'book',
          }
        ],
        status: data.status,
        confidence: data.confidence,
        message: data.message,
        matched_question: data.matched_question
      };

      setResponseData(formattedData);
      setIsLoading(false);
      setIsStreaming(true);

      if (chatId) {
        const session = (await supabase.auth.getSession()).data.session;
        if (session) {
          try {
            await fetch(`${backendUrl}/chats/${chatId}/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                role: 'assistant',
                content: formattedData.summary,
                metadata: formattedData
              }),
            });
          } catch (err) {
            console.error('Failed to save assistant message:', err);
          }
        }
      }

      timerRef.current = setTimeout(() => {
        if (!isCompletedRef.current) {
          isCompletedRef.current = true;
          setIsStreaming(false);
          if (onAnswerComplete) {
            onAnswerComplete(formattedData);
          }
        }
      }, 2000);
    } catch (err) {
      console.error('Search error:', err);
      setResponseData({
        summary: 'Sorry, I encountered an error connecting to the AI backend.',
        sources: [],
        status: 'error',
        message: 'Connection failed',
        matched_question: null
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponse();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]); // Only re-fetch when query changes, not mode

  const handleEnableInference = () => {
    fetchResponse(true);
  };

  // Show thinking animation during initial loading
  if (isLoading) {
    return <ThinkingAnimation />;
  }

  // Show streaming response or final response
  if (responseData) {
    return (
      <StreamingResponse
        content={responseData}
        isComplete={!isStreaming}
        status={responseData.status}
        onInference={handleEnableInference}
        confidence={responseData.confidence}
        message={responseData.message}
        matchedQuestion={responseData.matched_question}
      />
    );
  }

  // Fallback loading state
  return <ThinkingAnimation />;
}
