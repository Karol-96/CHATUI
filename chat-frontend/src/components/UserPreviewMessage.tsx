// src/components/UserPreviewMessage.tsx

import React from 'react';
import { User } from 'lucide-react';
import { UserPreviewMessageProps } from '../types';
import { tokens } from '../styles/tokens';

export const UserPreviewMessage: React.FC<UserPreviewMessageProps> = ({ content }) => {
  return (
    <div className="flex flex-row-reverse items-start space-x-reverse space-x-3 animate-pulse">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <User size={20} className="text-blue-600" />
        </div>
      </div>
      <div className="flex-1 flex justify-end">
        <div className="bg-blue-50 rounded-lg px-4 py-2 max-w-prose">
          <div className="text-sm font-medium text-blue-900">You</div>
          <div className="text-sm text-blue-700 mt-1">{content}</div>
        </div>
      </div>
    </div>
  );
};
