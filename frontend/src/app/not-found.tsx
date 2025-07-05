"use client";

import ErrorPage from "@/components/error-page";

export default function Custom404() {
  return (
    <ErrorPage
      message="Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or doesn't exist."
      showRefresh={false}
      statusCode={404}
      title="Page Not Found"
    />
  );
}
