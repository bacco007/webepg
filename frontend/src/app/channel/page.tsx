"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import React, { Suspense } from "react";
import { ChannelList } from "@/components/channel";
import LoadingSpinner from "@/components/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Create an error boundary component
class ErrorBoundaryComponent extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Error handling without console.log
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default function ChannelListPage() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <ErrorBoundaryComponent
        fallback={
          <div className="flex h-full items-center justify-center">
            <Alert className="max-w-md" variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                An error occurred while rendering the channel list. Please try
                refreshing the page.
              </AlertDescription>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 size-4" />
                Refresh Page
              </Button>
            </Alert>
          </div>
        }
      >
        <Suspense fallback={<LoadingSpinner />}>
          <ChannelList />
        </Suspense>
      </ErrorBoundaryComponent>
    </div>
  );
}
