import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage as Message, ChatWindowProps } from '../types';
import { ChatMessage } from './ChatMessage';

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  error,
  isLoading = false,
  previewMessage,
  isActive = false,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: isActive ? 'smooth' : 'auto'
      });
    }
  };

  // Auto-focus input when chat becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Reset pending message when loading finishes
  useEffect(() => {
    if (!isLoading) {
      setPendingMessage(null);
    }
  }, [isLoading]);

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    requestAnimationFrame(scrollToBottom);
  }, [messages, isLoading, pendingMessage, isActive]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputRef.current?.value.trim() && !isLoading) {
        const message = inputRef.current.value;
        inputRef.current.value = '';
        setDraftMessage('');
        setPendingMessage(message);
        onSendMessage(message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current?.value.trim() || isLoading) return;

    const message = inputRef.current.value;
    inputRef.current.value = '';
    setDraftMessage('');
    setPendingMessage(message);
    await onSendMessage(message);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftMessage(e.target.value);
  };

  return (
    <div className="flex flex-col h-full">
      <div 
        className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 bg-white dark:bg-gray-900 ${!isActive && !draftMessage ? 'pb-0' : ''}`}
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((message, index) => (
          <ChatMessage key={message.uuid || index} message={message} />
        ))}
        {pendingMessage && (
          <ChatMessage
            message={{
              role: 'user',
              content: pendingMessage,
              uuid: 'pending-user'
            }}
          />
        )}
        {isLoading && (
          <ChatMessage
            message={{
              role: 'assistant',
              content: 'Thinking deeply...',
              uuid: 'preview'
            }}
          />
        )}
        {error && (
          <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {(isActive || draftMessage) && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <textarea
            ref={inputRef}
            className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded resize-none outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
            rows={3}
            placeholder="Type your message..."
            readOnly={!isActive}
            onKeyDown={handleKeyDown}
            onChange={handleInputChange}
            value={draftMessage}
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !isActive}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
};
