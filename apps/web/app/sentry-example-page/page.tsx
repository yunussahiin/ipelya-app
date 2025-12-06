"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Sentry Test Page</h1>
      <p className="text-muted-foreground">Click the button below to trigger a test error</p>

      <button
        type="button"
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        onClick={() => {
          throw new Error("Sentry Frontend Test Error");
        }}
      >
        Throw Frontend Error
      </button>

      <button
        type="button"
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
        onClick={() => {
          Sentry.captureException(new Error("Sentry Captured Test Error"));
          alert("Error sent to Sentry!");
        }}
      >
        Capture Exception
      </button>

      <button
        type="button"
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        onClick={async () => {
          const res = await fetch("/api/sentry-example-api");
          if (!res.ok) {
            throw new Error("API Error");
          }
        }}
      >
        Trigger API Error
      </button>
    </div>
  );
}
