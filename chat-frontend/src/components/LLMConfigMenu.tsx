import React, { useState, useEffect } from 'react';
import { LLMConfig, LLMConfigUpdate, ResponseFormat, LLMClient } from '../types';
import { X } from 'lucide-react';

interface LLMConfigMenuProps {
  chatId: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (config: LLMConfigUpdate) => Promise<void>;
  currentConfig?: LLMConfig;
}

export const LLMConfigMenu: React.FC<LLMConfigMenuProps> = ({
  isOpen,
  onClose,
  onUpdate,
  currentConfig,
}) => {
  const [config, setConfig] = useState<LLMConfig | undefined>(currentConfig);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update local state when currentConfig changes
  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleUpdate = async () => {
    if (!config) return;
    try {
      setIsUpdating(true);
      await onUpdate(config);
      onClose();
    } catch (error) {
      console.error('Error updating LLM config:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !config) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              LLM Configuration
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
              onMouseDown={(e) => e.preventDefault()}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Max Tokens Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Max Tokens (1-16,384)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="16384"
                value={config.max_tokens}
                onChange={(e) => setConfig(prev => prev ? {...prev, max_tokens: parseInt(e.target.value)} : prev)}
                className="w-full accent-blue-600 dark:accent-blue-400"
              />
              <span className="text-sm min-w-[4ch] text-gray-600 dark:text-gray-400">
                {config.max_tokens}
              </span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Temperature (0-1)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig(prev => prev ? {...prev, temperature: parseFloat(e.target.value)} : prev)}
                className="w-full accent-blue-600 dark:accent-blue-400"
              />
              <span className="text-sm min-w-[3ch] text-gray-600 dark:text-gray-400">
                {config.temperature.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Response Format Select */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Response Format
            </label>
            <select
              value={config.response_format}
              onChange={(e) => setConfig(prev => prev ? {...prev, response_format: e.target.value as ResponseFormat} : prev)}
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            >
              <option value={ResponseFormat.text}>Text</option>
              <option value={ResponseFormat.tool}>Tool</option>
              <option value={ResponseFormat.auto_tools}>Auto Tools</option>
            </select>
          </div>

          {/* Use Cache Checkbox */}
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={config.use_cache}
                onChange={(e) => setConfig(prev => prev ? {...prev, use_cache: e.target.checked} : prev)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                Use Cache
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none"
              disabled={isUpdating}
              onMouseDown={(e) => e.preventDefault()}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none
                ${isUpdating ? 'cursor-wait' : 'cursor-pointer'}`}
              onMouseDown={(e) => e.preventDefault()}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
