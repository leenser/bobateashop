import React, { useState, useEffect } from 'react';

type TextSize = 'normal' | 'large' | 'xlarge';

export const AccessibilitySettings: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [textSize, setTextSize] = useState<TextSize>('normal');

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedTextSize = (localStorage.getItem('textSize') as TextSize) || 'normal';
    
    setIsDarkMode(savedDarkMode);
    setTextSize(savedTextSize);
    
    // Apply dark mode
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply text size
    document.documentElement.setAttribute('data-text-size', savedTextSize);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (showMenu) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.accessibility-menu-container')) {
          setShowMenu(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const changeTextSize = (size: TextSize) => {
    setTextSize(size);
    localStorage.setItem('textSize', size);
    document.documentElement.setAttribute('data-text-size', size);
  };

  return (
    <div className="fixed bottom-24 left-6 z-40 accessibility-menu-container">
      {!showMenu ? (
        <button
          onClick={() => setShowMenu(true)}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-purple-700 transition-colors font-semibold flex items-center space-x-2"
          aria-label="Accessibility settings"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-600 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-500 p-4 min-w-[240px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 dark:text-white">Accessibility</h3>
            <button
              onClick={() => setShowMenu(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          
          {/* Dark Mode Toggle */}
          <div className="mb-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</span>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-purple-600' : 'bg-gray-300'
                }`}
                aria-label="Toggle dark mode"
                role="switch"
                aria-checked={isDarkMode}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Text Size Controls */}
          <div className="mb-2">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Text Size
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => changeTextSize('normal')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors border-2 ${
                  textSize === 'normal'
                    ? 'bg-purple-100 dark:bg-purple-900 text-black dark:text-black border-purple-400 dark:border-purple-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-black dark:text-black border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label="Normal text size"
              >
                A
              </button>
              <button
                onClick={() => changeTextSize('large')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors border-2 ${
                  textSize === 'large'
                    ? 'bg-purple-100 dark:bg-purple-900 text-black dark:text-black border-purple-400 dark:border-purple-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-black dark:text-black border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label="Large text size"
              >
                <span className="text-lg">A</span>
              </button>
              <button
                onClick={() => changeTextSize('xlarge')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors border-2 ${
                  textSize === 'xlarge'
                    ? 'bg-purple-100 dark:bg-purple-900 text-black dark:text-black border-purple-400 dark:border-purple-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-black dark:text-black border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label="Extra large text size"
              >
                <span className="text-xl">A</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

