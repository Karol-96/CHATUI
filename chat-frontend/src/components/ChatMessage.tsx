// src/components/ChatMessage.tsx

import React from 'react';
import { 
  MessageSquare, 
  User, 
  AlertTriangle,
  Wrench,
  Terminal,
  GanttChartSquare
} from 'lucide-react';
import DataViewer from './DataViewer';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType | undefined;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (!message) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-100 text-red-700 rounded-md">
        <AlertTriangle className="mr-2" />
        <span>Error: Message is undefined</span>
      </div>
    );
  }

  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';
  const hasToolCall = message.tool_call_id !== undefined;

  const renderContent = (content: any): string => {
    if (typeof content === 'object' && content !== null) {
      return JSON.stringify(content);
    }
    return String(content);
  };

  const renderToolCall = (toolCall: any) => {
    try {
      const data = typeof toolCall === 'string' ? JSON.parse(toolCall) : toolCall;
      return <DataViewer data={data} tool_name={message.tool_name} />;
    } catch (error) {
      console.warn('Failed to parse tool call as JSON:', error);
      return <div className="whitespace-pre-wrap">{renderContent(toolCall)}</div>;
    }
  };

  const renderAssistantContent = (content: any) => {
    // For tool responses
    if (isTool) {
      try {
        const data = typeof content === 'string' ? JSON.parse(content) : content;
        return <DataViewer data={data} tool_name={message.tool_name} />;
      } catch (error) {
        console.warn('Failed to parse tool response as JSON:', error);
        return <div className="whitespace-pre-wrap">{renderContent(content)}</div>;
      }
    }

    // For non-executable (typed) tools - content is JSON string
    if (message.tool_name && !message.tool_call_id) {
      try {
        const data = typeof content === 'string' ? JSON.parse(content) : content;
        return <DataViewer data={data} tool_name={message.tool_name} />;
      } catch (error) {
        console.warn('Failed to parse typed tool response as JSON:', error);
        return <div className="whitespace-pre-wrap">{renderContent(content)}</div>;
      }
    }

    // For executable tools - show content and tool call
    if (message.tool_call_id) {
      const elements = [];

      // Add content if it exists
      if (content) {
        elements.push(
          <div key="content" className="whitespace-pre-wrap">{renderContent(content)}</div>
        );
      }

      // Add tool call visualization
      if (message.tool_call) {
        elements.push(
          <div key="tool-call" className={content ? "mt-2 pt-2 border-t border-gray-100" : ""}>
            {content && <div className="text-xs text-gray-500 mb-1">Tool Call:</div>}
            {renderToolCall(message.tool_call)}
          </div>
        );
      }

      return elements.length > 0 ? <>{elements}</> : null;
    }

    // For regular assistant messages
    return <div className="whitespace-pre-wrap">{renderContent(content)}</div>;
  };

  return (
    <div className={`flex gap-4 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            {isTool ? (
              <Wrench className="h-4 w-4 text-gray-600" />
            ) : message.tool_name && !message.tool_call_id ? (
              <GanttChartSquare className="h-4 w-4 text-gray-600" />
            ) : message.tool_call_id ? (
              <Terminal className="h-4 w-4 text-gray-600" />
            ) : (
              <MessageSquare className="h-4 w-4 text-gray-600" />
            )}
          </div>
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div className="text-xs text-gray-500 mb-1 px-1">
          {isUser ? 'You' : isTool ? `Tool Response: ${message.tool_name}` : hasToolCall ? `Assistant (Using: ${message.tool_name})` : 'Assistant'}
        </div>
        <div className={`px-4 py-3 rounded-2xl ${isUser ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'}`}>
          <div className="text-sm">
            {isUser ? (
              <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>
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
