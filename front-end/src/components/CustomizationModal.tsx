import React, { useState, useEffect } from 'react';
import { metaApi } from '../services/api';

interface CustomizationOptions {
  ice_levels: string[];
  sweetness_levels: string[];
  sizes?: string[];
  bases: string[];
  toppings: Array<{ key: string; label: string }>;
  flavor_shots: Array<{ key: string; label: string }>;
}

const SIZE_PRICE_DELTAS: Record<string, number> = {
  Small: 0,
  Medium: 0.5,
  Large: 2,
};

type SizeOption = 'Small' | 'Medium' | 'Large';
type TemperatureOption = 'Iced' | 'Hot';

interface CustomizationResult {
  customizations: string;
  size?: SizeOption;
}

interface CustomizationModalProps {
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: CustomizationResult) => void;
  initialCustomizations?: string;
  initialSize?: string;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  productName,
  isOpen,
  onClose,
  onConfirm,
  initialCustomizations = '',
  initialSize,
}) => {
  const [options, setOptions] = useState<CustomizationOptions | null>(null);
  const [temperature, setTemperature] = useState<TemperatureOption>('Iced');
  const [iceLevel, setIceLevel] = useState<string>('Normal');
  const [sweetness, setSweetness] = useState<string>('100%');
  const [base, setBase] = useState<string>('');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [flavorShot, setFlavorShot] = useState<string>('');
  const [size, setSize] = useState<string | undefined>(initialSize);

  useEffect(() => {
    if (isOpen) {
      // Reset to defaults whenever the modal opens so options don't "stick" between products
      setTemperature('Iced');
      setIceLevel('Normal');
      setSweetness('100%');
      setBase('');
      setSelectedToppings([]);
      setFlavorShot('');
      setSize(initialSize);

      loadOptions();

      if (initialCustomizations) {
        parseCustomizations(initialCustomizations);
      }
      if (initialSize) {
        setSize(initialSize);
      }
    }
  }, [isOpen, initialCustomizations, initialSize]);

  const loadOptions = async () => {
    try {
      const response = await metaApi.getOptions();
      const data = response.data;
      setOptions(data);
      if (!size && data?.sizes && data.sizes.length > 0) {
        setSize(data.sizes[0]);
      }
    } catch (error) {
      console.error('Error loading customization options:', error);
    }
  };

  const parseCustomizations = (customizations: string) => {
    // Customizations are stored as e.g. "Size: Medium (+$0.50); 50% ice, oat milk, boba"

    // Pull size out if present
    const sizeMatch = customizations.match(/Size:\s*(Small|Medium|Large)/i);
    if (sizeMatch) {
      const s = sizeMatch[1].charAt(0).toUpperCase() + sizeMatch[1].slice(1).toLowerCase();
      setSize(s);
    }

    // Remove size prefix for easier parsing
    const cleaned = customizations.replace(
      /Size:\s*(Small|Medium|Large)(\s*\(\+\$[0-9]+(\.[0-9]+)?\)\s*)?;\s*/i,
      ''
    );

    const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
    parts.forEach(part => {
      const lower = part.toLowerCase();

      if (lower === 'hot') {
        setTemperature('Hot');
        setIceLevel('No Ice');
      } else if (lower.includes('extra ice')) {
        setIceLevel('Extra Ice');
      } else if (lower === 'no ice') {
        setIceLevel('No Ice');
      } else if (lower.includes('ice')) {
        // "50% ice" etc.
        const ice = part.replace(/ice/i, '').trim();
        setIceLevel(ice || 'Normal');
      } else if (lower.includes('milk') || lower.includes('tea base')) {
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

    // Temperature first (and "Hot" implies no ice)
    if (temperature === 'Hot') {
      parts.push('Hot');
    } else {
      if (iceLevel && iceLevel !== 'Normal') {
        if (iceLevel.toLowerCase().includes('ice')) {
          // "Extra Ice" and "No Ice" already contain "Ice"
          parts.push(iceLevel);
        } else {
          parts.push(`${iceLevel} ice`);
        }
      }
    }

    if (base) parts.push(base);
    if (selectedToppings.length > 0) parts.push(...selectedToppings);
    if (flavorShot) parts.push(flavorShot);

    const customText = parts.join(', ') || 'Standard';
    let displayCustom = customText;

    if (size) {
      const delta = SIZE_PRICE_DELTAS[size] ?? 0;
      const deltaStr = delta > 0 ? ` (+$${delta.toFixed(2)})` : '';
      displayCustom = `Size: ${size}${deltaStr}; ${customText}`;
    }

    onConfirm({ customizations: displayCustom, size: size as SizeOption | undefined });
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
            {/* Temperature */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Temperature</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Iced', 'Hot'] as TemperatureOption[]).map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setTemperature(opt);
                      if (opt === 'Hot') {
                        setIceLevel('No Ice');
                      }
                    }}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      temperature === opt
                        ? 'border-purple-600 dark:border-purple-400 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            {options.sizes && options.sizes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {options.sizes.map(sz => (
                    <button
                      key={sz}
                      onClick={() => setSize(sz)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        size === sz
                          ? 'border-purple-600 dark:border-purple-400 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ice Level */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Ice Level</label>
              <div className={`grid grid-cols-3 gap-2 ${temperature === 'Hot' ? 'opacity-50 pointer-events-none' : ''}`}>
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
              {temperature === 'Hot' && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Ice options are disabled for hot drinks.
                </p>
              )}
            </div>

            {/* Sweetness Level (existing UI) */}
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
