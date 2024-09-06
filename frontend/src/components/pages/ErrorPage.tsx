'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
}

export default function ErrorPage({
  statusCode = 404,
  title = 'Page Not Found',
  message = "Sorry, we couldn't find the page you're looking for.",
}: ErrorPageProps) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md space-y-6 text-center">
        <AlertCircle className="text-destructive mx-auto size-16" aria-hidden="true" />
        <h1 className="text-4xl font-bold">
          {statusCode} - {title}
        </h1>
        <p className="text-muted-foreground text-lg">{message}</p>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
