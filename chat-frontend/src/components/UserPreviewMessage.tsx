// src/components/UserPreviewMessage.tsx

import React from 'react';
import { User } from 'lucide-react';

interface UserPreviewMessageProps {
  content: string;
}

const UserPreviewMessage: React.FC<UserPreviewMessageProps> = ({ content }) => {
  return (
    <div className="flex gap-4 mb-6 justify-end animate-fadeIn">
      <div className="flex flex-col items-end max-w-[80%]">
        <div className="text-xs text-gray-500 mb-1 px-1">
          You
        </div>
        <div
          className={`
            px-4 py-3 rounded-2xl
            bg-blue-500 text-white rounded-br-md animate-pulse
          `}
        >
          <div className="text-sm">
            {content}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-blue-600" />
        </div>
      </div>
    </div>
  );
};

export default UserPreviewMessage;
