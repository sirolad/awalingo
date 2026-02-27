'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Suspense } from 'react';

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const passed = searchParams.get('passed') === 'true';
  const score = searchParams.get('score') || '0';

  const handleBack = () => {
    router.back();
  };

  const handlePrimaryAction = () => {
    if (passed) {
      router.push('/home');
    } else {
      router.push('/curator-test');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 lg:px-8 lg:py-6">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8 lg:pb-16">
        <div className="w-full max-w-md lg:max-w-lg flex flex-col items-center">
          {/* Illustration */}
          <div className="relative w-64 h-64 lg:w-72 lg:h-72 mb-8 lg:mb-10">
            <Image
              src={
                passed ? '/assets/test/success.png' : '/assets/test/failure.png'
              }
              alt={passed ? 'Success illustration' : 'Failure illustration'}
              fill
              className="object-contain dark:invert dark:brightness-110"
              priority
            />
          </div>

          {/* Text Content */}
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="heading-3 text-neutral-950 dark:text-neutral-50 mb-2">
              {passed ? 'You passed!!' : 'Test failure.'}
            </h1>
            <p className="body-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
              {passed
                ? 'You have successfully passed the curator test'
                : "Sorry, you didn't quite make it this time, kindly take the test again."}
            </p>
            <p className="body-small text-neutral-500 dark:text-neutral-400 mt-4">
              Score: {score}/ {process.env.QUIZ_QUESTION_COUNT || 10}
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handlePrimaryAction}
            className="w-full max-w-sm bg-neutral-950 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 rounded-full h-14 lg:h-16 text-lg lg:text-xl font-semibold transition-colors"
          >
            {passed ? 'Go Home' : 'Retake Test'}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function CuratorTestResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
          <div className="body-base animate-pulse text-neutral-500 dark:text-neutral-400">
            Loading...
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
