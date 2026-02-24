'use client';

import * as Sentry from '@sentry/nextjs';
import Image from 'next/image';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <Image
              src="/assets/500/server-error.png"
              alt="Server error"
              width={400}
              height={300}
              className="mx-auto"
              priority
            />

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Something Went Wrong
              </h1>
              <p className="text-muted-foreground">
                An unexpected error occurred. Please try again or return to the
                home page.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <a
                href="/home"
                className="w-full inline-block rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
