import React from 'react'
import { MessageSquare, User, AlertTriangle, ChevronRight, Circle, Square, Triangle, Hash, List } from 'lucide-react'

interface ChatMessageType {
  role: 'user' | 'assistant' | 'system'
  content: string
  id?: number
}

interface ChatMessageProps {
  message: ChatMessageType | undefined
}

interface DataViewerProps {
  data: unknown
}

interface DataNodeProps {
  data: unknown
  path?: string
  depth?: number
}

const DataViewer: React.FC<DataViewerProps> = ({ data }) => {
  const DataNode: React.FC<DataNodeProps> = ({ data, path = '', depth = 0 }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const isObject = data !== null && typeof data === 'object';
    
    const getTypeIcon = (value: unknown) => {
      if (Array.isArray(value)) return <List size={12} className="text-purple-400" />;
      if (typeof value === 'object' && value !== null) return <Square size={12} className="text-indigo-400" />;
      if (typeof value === 'string') return <Circle size={8} className="text-emerald-400" />;
      if (typeof value === 'number') return <Hash size={8} className="text-blue-400" />;
      if (typeof value === 'boolean') return <Triangle size={8} className="text-amber-400" />;
      return <Circle size={8} className="text-gray-400" />;
    };

    const getValue = (value: unknown): string => {
      if (typeof value === 'string') return `"${value}"`;
      return String(value);
    };

    if (!isObject) {
      return (
        <div className="group flex items-center space-x-2 py-1.5 hover:bg-gray-50 rounded px-2 -mx-2">
          <div className="w-4 h-4 flex items-center justify-center">
            {getTypeIcon(data)}
          </div>
          <span className="font-mono text-gray-500">{path}</span>
          <span className={`font-mono ${
            typeof data === 'string' ? 'text-emerald-600' :
            typeof data === 'number' ? 'text-blue-600' :
            typeof data === 'boolean' ? 'text-amber-600' : 'text-gray-600'
          }`}>
            {getValue(data)}
          </span>
        </div>
      );
    }

    return (
      <div>
        <div 
          className="flex items-center space-x-2 py-1.5 cursor-pointer group hover:bg-gray-50 rounded px-2 -mx-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <ChevronRight 
              size={14} 
              className={`transform transition-transform duration-200 text-gray-400
                ${isExpanded ? 'rotate-90' : ''}`}
            />
          </div>
          <div className="w-4 h-4 flex items-center justify-center">
            {getTypeIcon(data)}
          </div>
          <span className="font-mono text-gray-700">{path || 'Assistant Response'}</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
            {Array.isArray(data) ? `array[${data.length}]` : `object{${Object.keys(data).length}}`}
          </span>
        </div>

        {isExpanded && (
          <div className="ml-4 border-l-2 border-gray-100 pl-4">
            {Array.isArray(data)
              ? data.map((item, index) => (
                  <DataNode
                    key={index}
                    data={item}
                    path={`[${index}]`}
                    depth={depth + 1}
                  />
                ))
              : Object.entries(data as Record<string, unknown>).map(([key, value]) => (
                  <DataNode
                    key={key}
                    data={value}
                    path={key}
                    depth={depth + 1}
                  />
                ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded w-full">
      <DataNode data={data} />
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (!message) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-100 text-red-700 rounded-md">
        <AlertTriangle className="mr-2" />
        <span>Error: Message is undefined</span>
      </div>
    )
  }

  const isUser = message.role === 'user'

  const renderAssistantContent = (content: string) => {
    try {
      const data = JSON.parse(content)
      return <DataViewer data={data} />
    } catch (error) {
      console.error('Failed to parse content:', error)
      return <div className="whitespace-pre-wrap">{content}</div>
    }
  }

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
            {isUser ? message.content : renderAssistantContent(message.content)}
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
  )
}

export default ChatMessage;