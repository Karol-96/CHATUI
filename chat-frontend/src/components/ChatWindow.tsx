import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { UserPreviewMessage } from './UserPreviewMessage';
import { ErrorDisplay } from './ErrorDisplay';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  error?: string | null;
  isLoading?: boolean;
  previewMessage?: string | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  error,
  isLoading = false,
  previewMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, previewMessage]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <ChatMessageComponent key={message.uuid || index} message={message} />
          ))}
          
          {/* Preview of user message while loading */}
          {isLoading && previewMessage && (
            <UserPreviewMessage content={previewMessage} />
          )}

          {/* Error display */}
          {error && <ErrorDisplay error={error} onDismiss={() => {}} />}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input container */}
      <div className="flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={onSendMessage}
            disabled={isLoading}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};
