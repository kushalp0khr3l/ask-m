import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, FileText, ImageIcon, ExternalLink, Zap } from 'lucide-react';
import logoImage from '../assets/logo.jpg';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax/browser';

declare global {
  interface Window {
    MathJax: any;
  }
}

interface StreamingResponseProps {
  query?: string;
  content: {
    summary: string;
    sources: Array<{
      type: string;
      title: string;
      subtitle: string;
      icon: any;
    }>;
  };
  isComplete: boolean;
  status?: string;
  onInference?: () => void;
  confidence?: number;
  message?: string;
  matchedQuestion?: string;
}

export function StreamingResponse({ query, content, isComplete, status, onInference, confidence, message, matchedQuestion }: StreamingResponseProps) {
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    if (isComplete && !showSources) {
      const timer = setTimeout(() => {
        setShowSources(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, showSources]);

  // Trigger MathJax typesetting when content updates or completion occurs
  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [content.summary, isComplete, showSources]);

  const iconMap: Record<string, any> = {
    book: BookOpen,
    file: FileText,
    image: ImageIcon,
    external: ExternalLink,
    zap: Zap
  };

  // Pre-process content to handle common LaTeX delimiter issues and "math in backticks"
  const isMathy = (text: string) => {
    const mathSymbols = /[√²³⁴⁵⁶⁷⁸⁹⁰∞→λθπΣΔ∇∂∫≈≠≤≥±×÷^Σ∏√]/;
    // More robust equation detection: includes single operators if accompanied by variables or numbers
    // Also matches single variables like "x", "y", "n" closer to math context if needed
    const equationPatterns = /[+\-*/=<>]{2,}|[0-9xXyYzZ\(\)]\s*[+\-*/=<>]|[+\-*/=<>] \s*[0-9xXyYzZ\(\)]|^[a-zA-Z]$/;
    return mathSymbols.test(text) || equationPatterns.test(text);
  };

  const processedSummary = (content.summary || '')
    // Handle double-escaped or single-escaped delimiters from LLM output
    .replace(/\\+(\[)/g, '$$$$')
    .replace(/\\+(\])/g, '$$$$')
    .replace(/\\+(\()/g, '$$')
    .replace(/\\+(\))/g, '$$')
    // Handle common function text to math
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/√(\d+|\w+|{[^}]+})/g, '\\sqrt{$1}')
    .replace(/√/g, '\\sqrt{}')
    // Handle inline math in backticks
    .replace(/`([^`\n]+)`/g, (match, p1) => (isMathy(p1) ? `$${p1}$` : match));

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-4 md:space-y-6 text-white font-sans">
      {/* Ask-M Response */}
      <motion.div
        className="bg-[#1E1F20] rounded-2xl md:rounded-3xl p-4 md:p-8 border border-[#2D2E30]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <img src={logoImage} alt="Ask-M Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <span className="text-lg md:text-xl text-white font-medium">Ask-M</span>
        </div>

        {/* Similar Match Banner */}
        {status === 'cache_similar' && isComplete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 md:p-6 mb-4 space-y-4"
          >
            {/* Banner Content */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-amber-500 font-medium text-sm">Similar Exam Question Found</p>
                  <p className="text-amber-200/60 text-xs text-pretty">This question appeared in exams in a slightly different form.</p>
                </div>
              </div>
              <button
                onClick={onInference}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <Zap className="w-3 h-3 fill-current" />
                Generate Exact Answer
              </button>
            </div>

            {matchedQuestion && (
              <div className="bg-[#1E1F20]/50 rounded-lg p-3 border border-amber-500/10">
                <p className="text-[#A0A0A0] text-[10px] uppercase font-bold tracking-wider mb-1">Original Exam Question</p>
                <p className="text-amber-100/80 text-sm italic leading-relaxed">
                  "{matchedQuestion}"
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Markdown Content */}
        <div className="prose prose-invert prose-sm md:prose-base max-w-none text-white/90 leading-relaxed mathjax-render">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeMathjax]}
            components={{
              // Premium styling for markdown elements
              strong: ({ node, ...prefix }) => <span className="text-white font-bold" {...prefix} />,
              p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 mb-4" {...props} />,
              li: ({ node, ...props }) => <li className="marker:text-[#A0A0A0]" {...props} />,
              code: ({ node, inline, ...props }: any) => {
                const content = String(props.children).replace(/\n$/, '');
                const isShort = content.length < 100 && !content.includes('\n');
                const mathy = isMathy(content);

                if (inline) {
                  if (mathy) {
                    return <span className="text-slate-100 font-sans italic mx-0.5" {...props} />;
                  }
                  return <code className="bg-[#2D2E30] px-1.5 py-0.5 rounded text-amber-400 text-sm md:text-base font-mono" {...props} />;
                }

                if (isShort) {
                  return (
                    <span className="inline-block my-1 mx-1">
                      <code className={`${mathy ? 'text-slate-100 font-sans italic border-none bg-transparent' : 'bg-[#0D0D0E] text-amber-200 font-mono border border-[#2D2E30]'} px-3 py-1 rounded-lg text-sm md:text-base`} {...props} />
                    </span>
                  );
                }

                return (
                  <pre className="bg-[#0D0D0E] p-4 rounded-xl border border-[#2D2E30] overflow-x-auto my-4 w-full">
                    <code className={`${mathy ? 'text-slate-100 font-sans' : 'text-amber-200 font-mono'} text-sm md:text-base`} {...props} />
                  </pre>
                );
              }
            }}
          >
            {processedSummary}
          </ReactMarkdown>

          {/* Thinking Dot while generating */}
          {!isComplete && (
            <motion.span
              className="inline-block w-2 h-2 bg-white rounded-full ml-1"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        {/* Sources & Syllabus Alignment - Fade in when complete */}
        <AnimatePresence>
          {showSources && (
            <motion.div
              className="border-t border-[#2D2E30] pt-4 md:pt-6 space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Confidence & Reasoning Section */}
              <div className="bg-[#2D2E30]/50 rounded-2xl p-4 md:p-6 border border-[#3D3E40]/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-white font-medium text-sm flex items-center gap-2">
                      AI Alignment & Confidence
                      {confidence !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${confidence >= 0.85 ? 'bg-green-500/20 text-green-400' :
                          confidence >= 0.60 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                          {confidence >= 0.85 ? 'High' : confidence >= 0.60 ? 'Medium' : 'Inference'}
                        </span>
                      )}
                    </h3>
                    <p className="text-[#A0A0A0] text-xs">
                      {message || (status === 'inference_used' ? 'Generated using live inference service.' : 'Analyzing alignment with Kathmandu University syllabus.')}
                    </p>
                  </div>

                  {confidence !== undefined && (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-bold text-lg leading-none">{Math.round(confidence * 100)}%</p>
                        <p className="text-[#A0A0A0] text-[10px] uppercase font-semibold">Confidence</p>
                      </div>
                      <div className="w-24 h-2 bg-[#1E1F20] rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${confidence >= 0.85 ? 'bg-green-500' :
                            confidence >= 0.60 ? 'bg-amber-500' :
                              'bg-blue-500'
                            }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${confidence * 100}%` }}
                          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[#A0A0A0] text-xs md:text-sm">
                  Sources & Syllabus Alignment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                  {Array.isArray(content.sources) && content.sources.map((source, index) => {
                    const IconComponent = typeof source.icon === 'string' ? iconMap[source.icon] || FileText : FileText;
                    return (
                      <motion.button
                        key={index}
                        className="bg-[#2D2E30] hover:bg-[#3D3E40] rounded-xl p-3 md:p-4 text-left transition-colors group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start gap-2 md:gap-3">
                          <div className="p-1.5 md:p-2 bg-[#1E1F20] rounded-lg">
                            <IconComponent className="w-3 h-3 md:w-4 md:h-4 text-[#A0A0A0]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-white text-xs md:text-sm truncate">
                                {source.title}
                              </p>
                              <ExternalLink className="w-3 h-3 text-[#A0A0A0] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                            <p className="text-[#A0A0A0] text-xs mt-1">
                              {source.subtitle}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
