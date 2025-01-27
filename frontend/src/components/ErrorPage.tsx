'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { AlertCircle, Home, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ErrorPageProperties {
  statusCode?: number;
  title?: string;
  message?: string;
  showRefresh?: boolean;
}

export default function ErrorPage({
  statusCode = 404,
  title = 'Page Not Found',
  message = "Sorry, we couldn't find the page you're looking for.",
  showRefresh = false,
}: ErrorPageProperties) {
  const [countdown, setCountdown] = useState(10);
  const router = useRouter();

  useEffect(() => {
    if (showRefresh) {
      const timer = setInterval(() => {
        setCountdown(previousCount =>
          previousCount > 0 ? previousCount - 1 : 0,
        );
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showRefresh]);

  useEffect(() => {
    if (showRefresh && countdown === 0) {
      router.refresh();
    }
  }, [countdown, router, showRefresh]);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2 text-3xl font-bold">
            <AlertCircle
              className="size-8 text-destructive"
              aria-hidden="true"
            />
            <span>
              {statusCode} - {title}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-lg text-muted-foreground">{message}</p>
          {showRefresh && (
            <p className="text-sm text-muted-foreground">
              The page will automatically refresh in {countdown} seconds.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button asChild>
            <Link href="/" className="flex items-center space-x-2">
              <Home className="size-4" />
              <span>Return to Home</span>
            </Link>
          </Button>
          {showRefresh && (
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCcw className="size-4" />
              <span>Refresh Now</span>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
