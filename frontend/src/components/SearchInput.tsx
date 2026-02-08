import { useState } from 'react';
import { ArrowUp, ChevronDown, Zap, BookOpen, Loader2 } from 'lucide-react';

interface SearchInputProps {
  onSearch: (query: string, mode: 'exam' | 'guided') => void;
  onFileUpload: (file: File) => void;
  isSearching?: boolean;
}

type SearchMode = 'exam' | 'guided';

interface Mode {
  id: SearchMode;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export function SearchInput({ onSearch, onFileUpload, isSearching }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [selectedMode, setSelectedMode] = useState<SearchMode>('guided');

  const modes: Mode[] = [
    {
      id: 'exam',
      name: 'Exam',
      description: 'Strict assessment mode with direct answers',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'guided',
      name: 'Guide',
      description: 'Interactive step-by-step support',
      icon: <BookOpen className="w-5 h-5" />
    }
  ];

  const currentMode = modes.find(m => m.id === selectedMode) || modes[1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), selectedMode);
      setQuery('');
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 pb-4 md:pb-8 px-4 md:px-8">
      <div className="max-w-3xl mx-auto relative">
        <form onSubmit={handleSubmit}>
          <div className={`bg-[#2D2E30] rounded-full flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 shadow-2xl border transition-all ${isSearching ? 'border-white/60 shadow-white/20' : 'border-[#3D3E40]'
            }`}>
            {/* Text Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search syllabus, ask a question, or paste text..."
              className="flex-1 bg-transparent text-white placeholder-[#A0A0A0] outline-none text-sm md:text-base"
              disabled={isSearching}
            />

            {/* Mode Selector Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => !isSearching && setShowModeDropdown(!showModeDropdown)}
                disabled={isSearching}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all flex-shrink-0 bg-[#3D3E40] hover:bg-[#4D4E50] text-white text-sm ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="hidden md:inline">{currentMode.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showModeDropdown && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowModeDropdown(false)}
                  />

                  {/* Menu */}
                  <div className="absolute right-0 bottom-full mb-2 w-80 bg-[#1E1F20]/95 backdrop-blur-xl border border-[#3D3E40] rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2">
                      {modes.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            setSelectedMode(mode.id);
                            setShowModeDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl transition-all group hover:bg-[#2D2E30] ${mode.id === selectedMode ? 'bg-[#2D2E30]' : ''
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${mode.id === selectedMode ? 'text-white' : 'text-[#A0A0A0]'
                              } group-hover:text-white transition-colors`}>
                              {mode.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${mode.id === selectedMode ? 'text-white' : 'text-[#E0E0E0]'
                                  } group-hover:text-white transition-colors`}>
                                  {mode.name}
                                </span>
                              </div>
                              <p className="text-xs text-[#A0A0A0] mt-0.5 leading-relaxed">
                                {mode.description}
                              </p>
                            </div>
                            {mode.id === selectedMode && (
                              <div className="mt-1">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!query.trim()}
              className={`p-2 rounded-full transition-all flex-shrink-0 ${query.trim()
                ? 'bg-[#3D3E40] hover:bg-[#4D4E50]'
                : 'bg-[#3D3E40] opacity-50 cursor-not-allowed'
                }`}
            >
              {isSearching ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <ArrowUp className="w-5 h-5 text-white" />}
            </button>
          </div>
        </form>

        {/* Helper Text */}
        <p className="text-center text-[#A0A0A0] text-xs mt-3 md:mt-4 px-2">
          Ask-M can make mistakes. Verify important information with course materials.
        </p>
      </div>
    </div>
  );
}