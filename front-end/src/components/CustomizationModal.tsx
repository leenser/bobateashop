import React, { useState, useEffect } from 'react';
import { metaApi } from '../services/api';

interface CustomizationOptions {
  ice_levels: string[];
  sweetness_levels: string[];
  bases: string[];
  toppings: Array<{ key: string; label: string }>;
  flavor_shots: Array<{ key: string; label: string }>;
}

interface CustomizationModalProps {
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customizations: string) => void;
  initialCustomizations?: string;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  productName,
  isOpen,
  onClose,
  onConfirm,
  initialCustomizations = '',
}) => {
  const [options, setOptions] = useState<CustomizationOptions | null>(null);
  const [iceLevel, setIceLevel] = useState<string>('Normal');
  const [sweetness, setSweetness] = useState<string>('100%');
  const [base, setBase] = useState<string>('');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [flavorShot, setFlavorShot] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      // Parse initial customizations if provided
      if (initialCustomizations) {
        parseCustomizations(initialCustomizations);
      }
    }
  }, [isOpen, initialCustomizations]);

  const loadOptions = async () => {
    try {
      const response = await metaApi.getOptions();
      setOptions(response.data);
    } catch (error) {
      console.error('Error loading customization options:', error);
    }
  };

  const parseCustomizations = (customizations: string) => {
    // Simple parsing - customizations are stored as "50% ice, oat milk, boba"
    const parts = customizations.split(',').map(p => p.trim());
    parts.forEach(part => {
      if (part.includes('ice')) {
        const ice = part.replace('ice', '').trim();
        setIceLevel(ice || 'Normal');
      } else if (part.includes('milk')) {
        setBase(part);
      } else if (['boba', 'lychee_jelly', 'pudding', 'grass_jelly'].some(t => part.includes(t))) {
        setSelectedToppings([part]);
      }
    });
  };

  const handleToppingToggle = (topping: string) => {
    setSelectedToppings(prev =>
      prev.includes(topping)
        ? prev.filter(t => t !== topping)
        : [...prev, topping]
    );
  };

  const handleConfirm = () => {
    const parts: string[] = [];
    if (iceLevel && iceLevel !== 'Normal') parts.push(`${iceLevel} ice`);
    if (base) parts.push(base);
    if (selectedToppings.length > 0) parts.push(...selectedToppings);
    if (flavorShot) parts.push(flavorShot);

    onConfirm(parts.join(', ') || 'Standard');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Customize {productName}</h2>
        
        {!options && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Loading customization options...</p>
          </div>
        )}
        
        {options && (
          <>
            {/* Ice Level */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Ice Level</label>
              <div className="grid grid-cols-3 gap-2">
                {options.ice_levels.map(level => (
                  <button
                    key={level}
                    onClick={() => setIceLevel(level)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      iceLevel === level
                        ? 'border-purple-600 dark:border-purple-400 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Sweetness Level */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Sweetness</label>
              <div className="grid grid-cols-5 gap-2">
                {options.sweetness_levels.map(level => (
                  <button
                    key={level}
                    onClick={() => setSweetness(level)}
                    className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                      sweetness === level
                        ? 'border-purple-600 dark:border-purple-400 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Base */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Base</label>
              <div className="grid grid-cols-3 gap-2">
                {options.bases.map(baseOption => (
                  <button
                    key={baseOption}
                    onClick={() => setBase(base === baseOption ? '' : baseOption)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      base === baseOption
                        ? 'border-purple-600 dark:border-purple-400 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {baseOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Toppings */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Toppings</label>
              <div className="grid grid-cols-2 gap-2">
                {options.toppings.map(topping => (
                  <button
                    key={topping.key}
                    onClick={() => handleToppingToggle(topping.label)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedToppings.includes(topping.label)
                        ? 'border-purple-600 dark:border-purple-400 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {topping.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Flavor Shots */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Flavor Shots (Optional)</label>
              <div className="grid grid-cols-3 gap-2">
                {options.flavor_shots.map(flavor => (
                  <button
                    key={flavor.key}
                    onClick={() => setFlavorShot(flavorShot === flavor.label ? '' : flavor.label)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      flavorShot === flavor.label
                        ? 'border-purple-600 dark:border-purple-400 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {flavor.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600"
              >
                Add to Cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

