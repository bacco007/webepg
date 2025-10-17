"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Component } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ProgramPageErrorBoundaryProps = {
  children: React.ReactNode;
  pageName: string;
};

type ProgramPageErrorBoundaryState = {
  hasError: boolean;
};

export class ProgramPageErrorBoundary extends Component<
  ProgramPageErrorBoundaryProps,
  ProgramPageErrorBoundaryState
> {
  constructor(props: ProgramPageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Error is handled by the error boundary UI
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <Alert className="max-w-md" variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              An error occurred while rendering the {this.props.pageName} view.
              Please try refreshing the page.
            </AlertDescription>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 size-4" />
              Refresh Page
            </Button>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
