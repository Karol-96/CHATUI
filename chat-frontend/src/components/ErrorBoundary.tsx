//chat-frontend\src\components\ErrorBoundary.tsx
import React, { ErrorInfo } from 'react';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../types';
import { ErrorDisplay } from './ErrorDisplay';

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-lg">
          <h2 className="text-red-800 font-medium mb-2">Something went wrong</h2>
          <p className="text-red-600 text-sm">
            {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 