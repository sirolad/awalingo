'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getOnboardingSeen, setOnboardingSeen } from '@/lib/onboarding';

export default function Onboarding5() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const seen = getOnboardingSeen();
    if (seen) {
      if (isAuthenticated) router.push('/home');
      else router.push('/signin');
    }
  }, [isAuthenticated, router]);

  const handleContinue = () => {
    setOnboardingSeen(true);
    router.push('/signup');
  };

  return (
    <div className="h-screen bg-[#F4F4F4] flex flex-col overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col px-10 md:px-8 lg:px-12 pt-8 md:pt-12 lg:pt-26 py-16 md:pb-8 lg:pb-10 mb-16">
        {/* Container for responsive layout */}
        <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between max-w-7xl mx-auto w-full">
          {/* Illustration Area */}
          <div className="flex-1 flex items-center justify-center relative lg:mr-12 pt-4">
            {/* Illustration Image */}
            <div className="w-80 md:w-96 lg:w-[520px] h-80 md:h-96 lg:h-[520px] relative">
              <Image
                src="/assets/onboarding/onboarding-5.png"
                alt="Vote for words illustration"
                fill
                className="object-contain dark:invert dark:brightness-110"
                priority
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-6 md:space-y-8 lg:space-y-10 mt-8 lg:mt-0 lg:flex-shrink-0 lg:max-w-md xl:max-w-lg">
            {/* Text Content */}
            <div className="text-center lg:text-left space-y-3 md:space-y-4 lg:space-y-5">
              <h1 className="text-[26px] md:text-[32px] lg:text-[38px] xl:text-[42px] font-medium leading-[36px] md:leading-[42px] lg:leading-[48px] xl:leading-[52px] tracking-[-0.5px] text-[#111111] font-[Parkinsans]">
                Made By You For The World
              </h1>
              <p className="text-[15px] md:text-[17px] lg:text-[19px] xl:text-[21px] font-normal leading-[21px] md:leading-[25px] lg:leading-[28px] xl:leading-[31px] text-[rgba(17,17,17,0.8)] font-[Metropolis] px-4 lg:px-0 max-w-lg mx-auto lg:mx-0">
                A modern living dictionary based on your votes, your words.
                Every vote shapes the future of your mother tongue.
              </p>
            </div>

            {/* Progress Indicators */}
            <div className="flex justify-center lg:justify-start items-center space-x-2 md:space-x-3">
              <div className="w-[10px] md:w-[12px] lg:w-[14px] h-2 md:h-2.5 lg:h-3 bg-[rgba(17,17,17,0.2)] rounded-full"></div>
              <div className="w-[10px] md:w-[12px] lg:w-[14px] h-2 md:h-2.5 lg:h-3 bg-[rgba(17,17,17,0.2)] rounded-full"></div>
              <div className="w-[50px] md:w-[60px] lg:w-[70px] h-2 md:h-2.5 lg:h-3 bg-[#111111] rounded-full"></div>
            </div>

            {/* Action Button - Only Continue button, no Skip */}
            <div className="flex">
              <Button
                onClick={handleContinue}
                className="w-full btn-big md:h-[64px] lg:h-[70px] flex items-center justify-center bg-[#111111] rounded-full shadow-[0px_3px_32px_-1px_rgba(0,0,0,0.15)] hover:bg-[#333333] transition-all active:scale-[0.98]"
              >
                <span className="text-[16px] md:text-[18px] lg:text-[20px] font-semibold leading-[22px] md:leading-[24px] lg:leading-[26px] text-white font-[Parkinsans]">
                  Continue
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
