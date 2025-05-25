'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Custom error classes for different types of errors
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error handling utility functions
export const handleError = (error: unknown): string => {
  if (error instanceof APIError) {
    return `API Error: ${error.message}`;
  }
  if (error instanceof NetworkError) {
    return `Network Error: ${error.message}`;
  }
  if (error instanceof ValidationError) {
    return `Validation Error: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Error boundary component props
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// Error boundary component
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (error: Error) => {
      console.error('Error caught by boundary:', error);
      setError(error);
      setHasError(true);
    };

    window.addEventListener('error', event => handleError(event.error));
    window.addEventListener('unhandledrejection', event =>
      handleError(event.reason),
    );

    return () => {
      window.removeEventListener('error', event => handleError(event.error));
      window.removeEventListener('unhandledrejection', event =>
        handleError(event.reason),
      );
    };
  }, []);

  if (hasError) {
    return (
      <ErrorAlert
        message={error?.message || 'Something went wrong'}
        onRetry={() => {
          setHasError(false);
          setError(null);
        }}
      />
    );
  }

  return <>{children}</>;
}

// Error alert component
interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="size-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex justify-between items-center">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// API error handling wrapper
export async function withErrorHandling<T>(p0: Promise<Response>, p1: string, promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof Response) {
      const data = await error.json().catch(() => ({}));
      throw new APIError(data.message || 'API request failed');
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new NetworkError('Network request failed');
    }
    throw error;
  }
}
