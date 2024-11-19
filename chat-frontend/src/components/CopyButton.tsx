// src/components/CopyButton.tsx

import React, { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setIsCopied(true);
        // Revert back to original state after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => {
        // Optionally handle copy failure
        // For simplicity, we're not changing the state on failure
      });
  };

  return (
    <button
      onClick={handleCopy}
      className={`ml-auto focus:outline-none ${
        isCopied 
          ? 'text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
      } transition-colors duration-200`}
      title="Copy JSON"
    >
      {isCopied ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
};

export default CopyButton;
