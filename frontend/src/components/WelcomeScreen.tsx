import { useState, useEffect } from 'react';
import logoImage from '../assets/logo.jpg';

interface WelcomeScreenProps {
  onQuickStart: (query: string) => void;
}

const DEFAULT_OPTIONS = [
  'Summarize last lecture',
  'Find syllabus references for Algorithms',
  'Upload handwritten notes',
  'Explain Database Normalization',
];

export function WelcomeScreen({ onQuickStart }: WelcomeScreenProps) {
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const backendUrl = rawBackendUrl.replace(/\/$/, '');
        const response = await fetch(`${backendUrl}/cache/samples`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setOptions(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch cache samples:', err);
      }
    };

    fetchSamples();
  }, []);

  return (
    <div className="h-full flex items-center justify-center px-4 md:px-8 pt-40 pb-40">
      <div className="max-w-3xl w-full text-center space-y-6 md:space-y-8">
        {/* Welcome Message */}
        <div className="space-y-3 md:space-y-4">
          <div className="inline-flex items-center justify-center mb-3 md:mb-4">
            <img src={logoImage} alt="Ask-M Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
          </div>
          <h1 className="text-3xl md:text-5xl text-white">
            Hello KU Student.
          </h1>
          <p className="text-lg md:text-2xl text-[#A0A0A0]">
            What are we studying today?
          </p>
        </div>

        {/* Quick Start Options */}
        <div className="flex flex-wrap items-center justify-center gap-3 px-4">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onQuickStart(option)}
              className="px-4 py-3 md:px-6 bg-[#2D2E30] hover:bg-[#3D3E40] text-white rounded-full transition-colors text-sm md:text-base border border-[#3D3E40]/50 hover:border-white/20 shadow-lg hover:shadow-white/5 active:scale-95 transform transition-transform"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}