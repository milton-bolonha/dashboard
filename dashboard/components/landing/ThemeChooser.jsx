"use client";
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export function ThemeChooser() {
  const { themes, selectedTheme, setSelectedTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-50">
      {/* Botão recolhido */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-black text-white p-3 rounded-r-lg shadow-lg hover:shadow-xl transition-all hover:bg-gray-800"
          title="Choose Theme"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Painel expandido */}
      {isExpanded && (
        <div className="bg-black text-white p-6 rounded-r-lg shadow-2xl min-w-[320px] border-r-4 border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Choose Theme</h3>
            <button 
              onClick={() => setIsExpanded(false)}
              className="hover:bg-gray-800 p-1 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setSelectedTheme(theme);
                  setIsExpanded(false);
                }}
                className={`w-full text-left p-4 rounded-lg transition-all hover:scale-105 ${
                  selectedTheme?.id === theme.id
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{theme.icon}</span>
                  <div>
                    <div className="font-semibold">{theme.name}</div>
                    <div className="text-sm opacity-75">{theme.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
