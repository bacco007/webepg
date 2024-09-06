'use client';

import ErrorPage from '@/components/pages/ErrorPage';

export default function Custom500() {
  return (
    <ErrorPage
      statusCode={500}
      title="Server Error"
      message="Sorry, something went wrong on our end. We're working on fixing it."
    />
  );
}
