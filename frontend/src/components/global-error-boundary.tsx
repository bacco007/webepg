"use client";

import { AlertCircle, Bug, Home, Info, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
};

// Error categorization for better user experience
type ErrorCategory = {
  type: "network" | "runtime" | "component" | "unknown";
  title: string;
  message: string;
  suggestions: string[];
  severity: "low" | "medium" | "high";
};

function categorizeError(error: Error): ErrorCategory {
  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || "";

  // Network-related errors
  if (
    errorMessage.includes("fetch") ||
    errorMessage.includes("network") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection")
  ) {
    return {
      message: "There was a problem connecting to our servers.",
      severity: "medium",
      suggestions: [
        "Check your internet connection",
        "Try refreshing the page",
        "Wait a few minutes and try again",
      ],
      title: "Connection Error",
      type: "network",
    };
  }

  // Runtime errors
  if (
    errorMessage.includes("syntax") ||
    errorMessage.includes("reference") ||
    errorMessage.includes("type") ||
    errorStack.includes("react")
  ) {
    return {
      message: "Something went wrong with the application.",
      severity: "high",
      suggestions: [
        "Refresh the page to reload the application",
        "Clear your browser cache",
        "Try using a different browser",
      ],
      title: "Application Error",
      type: "runtime",
    };
  }

  // Component errors
  if (errorStack.includes("component") || errorMessage.includes("render")) {
    return {
      message: "There was a problem displaying this content.",
      severity: "medium",
      suggestions: [
        "Refresh the page",
        "Navigate to a different section",
        "Contact support if the problem persists",
      ],
      title: "Display Error",
      type: "component",
    };
  }

  // Default unknown error
  return {
    message: "An unexpected error occurred.",
    severity: "medium",
    suggestions: [
      "Refresh the page",
      "Try again later",
      "Contact support if the problem continues",
    ],
    title: "Unexpected Error",
    type: "unknown",
  };
}

// Generate unique error ID for tracking
function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Development-only logging function
function logErrorToConsole(
  errorId: string,
  error: Error,
  errorInfo: ErrorInfo,
  errorData: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "development") {
    // In development, we could implement a custom logging mechanism
    // For now, we'll store the error data for potential debugging
    try {
      // Store error data in sessionStorage for development debugging
      const debugData = {
        componentStack: errorInfo.componentStack,
        errorData,
        errorId,
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString(),
      };

      sessionStorage.setItem(
        `debug_error_${errorId}`,
        JSON.stringify(debugData)
      );
    } catch {
      // Silently fail if storage is not available
    }
  }
}

// Error logging utility (can be extended to send to external services)
function logError(error: Error, errorInfo: ErrorInfo, errorId: string): void {
  const errorData = {
    category: categorizeError(error),
    componentStack: errorInfo.componentStack,
    id: errorId,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Log to console in development only
  logErrorToConsole(errorId, error, errorInfo, errorData);

  // Store error in sessionStorage for potential recovery
  try {
    const errorHistory = JSON.parse(
      sessionStorage.getItem("errorHistory") || "[]"
    );
    errorHistory.push({
      category: errorData.category.type,
      id: errorId,
      message: error.message,
      timestamp: errorData.timestamp,
    });
    // Keep only last 5 errors
    if (errorHistory.length > 5) {
      errorHistory.shift();
    }
    sessionStorage.setItem("errorHistory", JSON.stringify(errorHistory));
  } catch {
    // Ignore storage errors
  }
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
    errorId: null,
    errorInfo: null,
    hasError: false,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      error,
      errorId: generateErrorId(),
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || generateErrorId();

    // Log the error
    logError(error, errorInfo, errorId);

    // Update state with error info
    this.setState({
      errorId,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount < maxRetries) {
      this.setState((prevState) => ({
        error: null,
        errorId: null,
        errorInfo: null,
        hasError: false,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // After max retries, do a full page reload
      window.location.reload();
    }
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId, retryCount } = this.state;
      const category = error ? categorizeError(error) : null;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="font-bold text-2xl">
                {category?.title || "Something went wrong"}
              </CardTitle>
              <p className="text-muted-foreground">
                {category?.message ||
                  "An unexpected error occurred. Please try refreshing the page."}
              </p>
              {errorId && (
                <Badge className="mt-2" variant="outline">
                  Error ID: {errorId}
                </Badge>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Suggestions */}
              {category && category.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 font-semibold">
                    <Info className="h-4 w-4" />
                    What you can try:
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
                    {category.suggestions.map((suggestion) => (
                      <li key={`suggestion-${suggestion}`}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Error Details (Collapsible) */}
              {error && process.env.NODE_ENV === "development" && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button className="w-full" size="sm" variant="outline">
                      <Bug className="mr-2 h-4 w-4" />
                      Show Error Details
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="rounded-md bg-muted p-3 font-mono text-xs">
                      <div className="mb-2">
                        <strong>Error:</strong> {error.message}
                      </div>
                      {errorInfo?.componentStack && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>

            <CardFooter className="flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                className="flex-1 sm:flex-none"
                onClick={this.handleRetry}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {retryCount > 0 ? `Try Again (${retryCount}/3)` : "Try Again"}
              </Button>

              <Button
                className="flex-1 sm:flex-none"
                onClick={this.handleRefresh}
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>

              <Button asChild className="flex-1 sm:flex-none" variant="outline">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
