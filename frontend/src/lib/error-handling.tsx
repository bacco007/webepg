"use client";

import { AlertCircle } from "lucide-react";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Custom error classes for different types of errors
export class APIError extends Error {
  statusCode?: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ValidationError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
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
  return "An unexpected error occurred";
};

// Error boundary component
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleGlobalError = (errorEvent: Error) => {
      setError(errorEvent);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const rejectionError =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
      setError(rejectionError);
      setHasError(true);
    };

    window.addEventListener("error", (event) => handleGlobalError(event.error));
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", (event) =>
        handleGlobalError(event.error)
      );
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  if (hasError) {
    return (
      <ErrorAlert
        message={error?.message || "Something went wrong"}
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
    <Alert className="mb-4" variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button onClick={onRetry} size="sm" variant="outline">
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// API error handling wrapper
export async function withErrorHandling<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof Response) {
      const data = await error.json().catch(() => ({}));
      throw new APIError(
        data.message || "API request failed",
        error.status,
        data
      );
    }
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new NetworkError("Network request failed");
    }
    throw error;
  }
}
