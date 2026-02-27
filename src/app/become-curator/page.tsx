'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function BecomeCuratorPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleTakeTest = () => {
    // TODO: Navigate to curator test page
    router.push('/curator-test');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 lg:px-8 lg:py-6">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8 lg:pb-16">
        <div className="w-full max-w-md lg:max-w-6xl flex flex-col lg:flex-row items-center lg:gap-12">
          {/* Illustration */}
          <div className="relative w-80 h-80 lg:w-[28rem] lg:h-[28rem] mb-8 lg:mb-0 flex-shrink-0">
            <Image
              src="/assets/dictionary/curator.png"
              alt="Become a Curator illustration"
              fill
              className="object-contain dark:invert dark:brightness-110"
              priority
            />
          </div>

          {/* Text Content & Button */}
          <div className="flex flex-col items-center lg:items-start w-full">
            {/* Text Content */}
            <div className="text-center lg:text-left mb-8 lg:mb-12">
              <h1 className="heading-3 text-neutral-950 dark:text-neutral-50 mb-2">
                Become a Curator!
              </h1>
              <p className="body-base lg:body-large text-neutral-500 dark:text-neutral-400">
                Suggest new words
              </p>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleTakeTest}
              className="w-full max-w-sm bg-neutral-950 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 rounded-full h-14 lg:h-16 text-lg lg:text-xl font-semibold transition-colors"
            >
              Take the test
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
