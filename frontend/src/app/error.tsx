'use client';

import React from 'react';

import ErrorPage from '@/components/ErrorPage';

export default function Custom500() {
  return (
    <ErrorPage
      statusCode={500}
      title="Server Error"
      message="Sorry, something went wrong on our end. We're working on fixing it."
      showRefresh={true}
    />
  );
}
