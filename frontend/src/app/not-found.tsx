'use client';

import React from 'react';

import ErrorPage from '@/components/pages/ErrorPage';

export default function Custom404() {
  return (
    <ErrorPage
      statusCode={404}
      title="Page Not Found"
      message="Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or doesn't exist."
      showRefresh={false}
    />
  );
}
