"use client";

import ErrorPage from "@/components/error-page";

export default function Custom500() {
  return (
    <ErrorPage
      message="Sorry, something went wrong on our end. We're working on fixing it."
      showRefresh={true}
      statusCode={500}
      title="Server Error"
    />
  );
}
