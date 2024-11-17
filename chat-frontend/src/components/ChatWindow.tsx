import React, { useRef, useEffect } from 'react';
import { ChatMessage as Message } from '../types';
import { ChatMessage } from './ChatMessage';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  error?: string;
  isLoading?: boolean;
  previewMessage?: string;
  isActive?: boolean;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  onActivate?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  error,
  isLoading = false,
  previewMessage,
  isActive = false,
  onInputFocus,
  onInputBlur,
  onActivate,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when chat becomes active
  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) {
        if (e.key === 'Enter') {
          if (e.shiftKey) {
            return;
          }
          e.preventDefault();
          if (inputRef.current?.value.trim() && !isLoading) {
            const message = inputRef.current.value;
            inputRef.current.value = '';
            onSendMessage(message);
          }
        } else if (e.key === 'Escape') {
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, onSendMessage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current?.value.trim() || isLoading) return;

    const message = inputRef.current.value;
    inputRef.current.value = '';
    await onSendMessage(message);
  };

  const handleInputFocus = (e: React.FocusEvent) => {
    if (!isActive && onActivate) {
      onActivate();
    }
    onInputFocus?.();
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4" onClick={() => !isActive && onActivate?.()}>
        {messages.map((message, index) => (
          <ChatMessage key={message.uuid || index} message={message} />
        ))}
        {isLoading && previewMessage && (
          <ChatMessage
            message={{
              role: 'assistant',
              content: previewMessage,
              uuid: 'preview'
            }}
          />
        )}
        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <textarea
          ref={inputRef}
          className="w-full p-2 border rounded resize-none"
          rows={3}
          placeholder="Type your message..."
          onFocus={handleInputFocus}
          onBlur={onInputBlur}
          disabled={!isActive}
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading || !isActive}
        >
          Send
        </button>
      </form>
    </div>
  );
};
