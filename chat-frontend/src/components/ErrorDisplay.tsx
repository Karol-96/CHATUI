import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 p-4 bg-red-100 border border-red-400 rounded-md z-50 flex items-center gap-2">
      <div className="text-red-700">{error}</div>
      <button
        onClick={onDismiss}
        className="text-white bg-red-600 px-2 py-1 rounded hover:bg-red-700"
      >
        Dismiss
      </button>
    </div>
  );
};
