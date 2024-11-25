import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage as Message, ChatWindowProps, MessageRole } from '../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  error,
  isLoading = false,
  previewMessage,
  isActive = false,
}) => {
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

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    requestAnimationFrame(scrollToBottom);
  }, [messages, isLoading, pendingMessage, isActive]);

  // Reset pending message when loading finishes
  useEffect(() => {
    if (!isLoading) {
      setPendingMessage(null);
    }
  }, [isLoading]);

  return (
    <div className="flex flex-col h-full">
      <div 
        className={`flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4 scrollbar scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 bg-white dark:bg-gray-900 ${!isActive && !draftMessage ? 'pb-0' : ''}`}
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((message, index) => (
          <ChatMessage key={message.uuid || index} message={message} />
        ))}
        {pendingMessage && !isLoading && (
          <ChatMessage
            message={{
              role: MessageRole.user,
              content: pendingMessage,
              uuid: 'pending-user',
              timestamp: new Date()
            }}
          />
        )}
        {isLoading && (
          <ChatMessage
            message={{
              role: MessageRole.assistant,
              content: 'Thinking deeply...',
              uuid: 'preview',
              timestamp: new Date()
            }}
          />
        )}
        {error && (
          <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {(isActive || draftMessage) && (
        <ChatInput 
          onSendMessage={async (message: string, triggerAssistant?: boolean) => {
            if (!isLoading) {
              // Only set pending message for normal sends
              if (!triggerAssistant) {
                setPendingMessage(message);
              } else {
                setPendingMessage(null);
              }
              await onSendMessage(message, triggerAssistant);
            }
          }}
          onTriggerAssistant={async () => {
            if (!isLoading) {
              setPendingMessage(null);
              await onSendMessage('', true);
            }
          }}
          disabled={isLoading || !isActive}
          autoFocus={isActive}
        />
      )}
    </div>
  );
};
