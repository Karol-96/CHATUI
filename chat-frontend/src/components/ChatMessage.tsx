// src/components/ChatMessage.tsx

import React from 'react';
import { 
  MessageSquare, 
  User, 
  AlertTriangle 
} from 'lucide-react';
import DataViewer from './DataViewer';

interface ChatMessageType {
  role: 'user' | 'assistant' | 'system';
  content: string;
  uuid?: string;
  parent_message_uuid?: string | null;
  tool_name?: string;
}

interface ChatMessageProps {
  message: ChatMessageType | undefined;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (!message) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-100 text-red-700 rounded-md">
        <AlertTriangle className="mr-2" />
        <span>Error: Message is undefined</span>
      </div>
    );
  }

  const isUser = message.role === 'user';

  const renderAssistantContent = (content: string) => {
    try {
      const data = JSON.parse(content);
      return <DataViewer data={data} tool_name={message.tool_name} />;
    } catch (error) {
      console.error('Failed to parse content:', error);
      return <div className="whitespace-pre-wrap">{content}</div>;
    }
  };

  return (
    <div className={`flex gap-4 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div className="text-xs text-gray-500 mb-1 px-1">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div
          className={`
            px-4 py-3 rounded-2xl
            ${isUser 
              ? 'bg-blue-500 text-white rounded-br-md' 
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
            }
          `}
        >
          <div className="text-sm">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : renderAssistantContent(message.content)}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
