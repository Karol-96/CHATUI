import React, { useRef, useState, useEffect } from 'react';
import { Send, Minimize2, Maximize2, CornerDownLeft } from 'lucide-react';
import { ChatInputProps } from '../types';

const DEFAULT_HEIGHT = 44;

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onTriggerAssistant,
  disabled = false,
  autoFocus = false 
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLTextAreaElement>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (input.trim()) {
      onSendMessage(input.trim(), false); // Explicitly pass false for normal sends
      setInput('');
      setHeight(DEFAULT_HEIGHT);
      setIsCollapsed(false);
    }
  };

  const handleTriggerAssistant = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled) return;
    
    onSendMessage('', true);
    setInput('');
    setHeight(DEFAULT_HEIGHT);
    setIsCollapsed(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Shift:', e.shiftKey);
    
    if (e.key === 'Enter') {
      // First check for Ctrl+Enter
      if (e.ctrlKey && onTriggerAssistant) {
        console.log('Ctrl+Enter detected, triggering assistant');
        e.preventDefault();
        onTriggerAssistant();
      }
      // Then check for normal Enter (but not if Shift is pressed)
      else if (!e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
      // Shift+Enter falls through to default behavior (newline)
    }
  };

  // Measure content height without affecting the display
  const measureContentHeight = (): number => {
    if (!measureRef.current) return DEFAULT_HEIGHT;
    
    // Clone current textarea's content into measure textarea
    measureRef.current.value = input;
    
    // Reset height to allow proper scrollHeight measurement
    measureRef.current.style.height = 'auto';
    
    // Get the scroll height
    const scrollHeight = measureRef.current.scrollHeight;
    
    // Constrain between default and max (50% viewport)
    const maxHeight = Math.floor(window.innerHeight * 0.5);
    return Math.min(Math.max(scrollHeight, DEFAULT_HEIGHT), maxHeight);
  };

  const updateHeight = () => {
    if (isCollapsed) {
      setHeight(DEFAULT_HEIGHT);
    } else {
      setHeight(measureContentHeight());
    }
  };

  // Update height when input changes or collapse state changes
  useEffect(() => {
    updateHeight();
  }, [input, isCollapsed]);

  // Update height on window resize
  useEffect(() => {
    const handleResize = () => updateHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [input, isCollapsed]);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700"
    >
      <div className="flex gap-2">
        <div className="flex-1 relative">
          {/* Hidden textarea for measurement */}
          <textarea
            ref={measureRef}
            className="absolute opacity-0 pointer-events-none"
            style={{
              width: textareaRef.current?.offsetWidth,
              padding: '8px',
              maxHeight: 'none',
            }}
            tabIndex={-1}
            aria-hidden="true"
          />
          
          {/* Visible textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-auto transition-[height] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            style={{ 
              height: `${height}px`,
              maxHeight: `${Math.floor(window.innerHeight * 0.5)}px`
            }}
            autoFocus={autoFocus}
          />

          {/* Control buttons */}
          <div className="absolute top-2 right-2 flex gap-1">
            {isCollapsed && input.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"
                title="Expand to fit content"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
            {!isCollapsed && height > DEFAULT_HEIGHT && (
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"
                title="Collapse"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {onTriggerAssistant && (
          <button
            type="button"
            onClick={handleTriggerAssistant}
            disabled={disabled}
            className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Trigger assistant (Ctrl+Enter)"
          >
            <CornerDownLeft className="h-5 w-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Send message"
        >
          <Send className="h-5 w-4" />
        </button>
      </div>
    </form>
  );
};
