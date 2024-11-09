//chat-frontend\src\components\LoadingMessage.tsx
import React from 'react'
import { MessageSquare } from 'lucide-react'

export function LoadingMessage() {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-gray-600" />
        </div>
      </div>

      <div className="flex flex-col items-start max-w-[80%]">
        <div className="text-xs text-gray-500 mb-1 px-1">
          Assistant
        </div>
        <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            </div>
            <span className="text-sm text-gray-600">Thinking deeply...</span>
          </div>
        </div>
      </div>
    </div>
  )
}