'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { APP_NAME } from '@/lib/brand';

export default function EmailVerification1() {
  const router = useRouter();
  const { user } = useAuth();
  const [initiateVerification, setInitiateVerification] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.toString() !== '') {
      const redirectpage = urlParams.get('initiate');
      if (redirectpage && redirectpage === 'true') {
        setInitiateVerification(true);
      }
    }
  }, [router]);
  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push('/email-verification/2');
  };

  return (
    <div className="h-screen bg-[#F4F4F4] flex flex-col">
      {/* Back Button */}
      <div className="absolute top-[77px] md:top-[90px] lg:top-[110px] left-6 md:left-8 lg:left-12 z-10">
        <button
          onClick={handleBack}
          className="w-[34px] h-[34px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px] flex items-center justify-center rounded-full hover:bg-white/50 transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="md:w-6 md:h-6 lg:w-7 lg:h-7"
          >
            <path
              d="M20 12H4M4 12L10 6M4 12L10 18"
              stroke="#292929"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Progress Indicators */}
      <div className="absolute top-[90px] md:top-[103px] lg:top-[123px] left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-16 md:w-20 lg:w-24 h-[3px] md:h-[4px] lg:h-[5px] bg-[#D9D9D9] rounded-full"></div>
          <div className="w-16 md:w-20 lg:w-24 h-[3px] md:h-[4px] lg:h-[5px] bg-[#111111] rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-6 md:px-8 lg:px-12 pt-[220px] md:pt-[260px] lg:pt-[300px]">
        {/* Email Illustration */}
        <div className="w-[310px] md:w-[380px] lg:w-[450px] h-[300px] md:h-[360px] lg:h-[420px] mb-11 md:mb-14 lg:mb-16 relative">
          <Image
            src="/assets/email-verification/account-created.png"
            alt="Account created illustration"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Content */}
        <div className="w-full max-w-[382px] md:max-w-[480px] lg:max-w-[580px] space-y-11 md:space-y-14 lg:space-y-16">
          {/* Text Content */}
          <div className="text-center space-y-3 md:space-y-4 lg:space-y-5">
            <h1 className="text-[26px] md:text-[32px] lg:text-[38px] font-medium leading-[36px] md:leading-[42px] lg:leading-[48px] tracking-[-1.9230769230769231%] text-[#111111] font-[Parkinsans]">
              Account Created!
            </h1>
            <p className="text-[15px] md:text-[17px] lg:text-[19px] font-normal leading-[21px] md:leading-[25px] lg:leading-[28px] text-[rgba(17,17,17,0.8)] font-[Metropolis] max-w-md md:max-w-lg lg:max-w-xl mx-auto">
              {`Your ${APP_NAME} account has been successfully created! Verify your email address to proceed.`}
            </p>
          </div>

          {/* Action Button */}
          {((user &&
            user?.confirmation_sent_at == null &&
            user?.confirmed_at == null) ||
            initiateVerification) && (
            <Button
              onClick={handleContinue}
              className="w-full btn-big md:h-[64px] lg:h-[70px] flex items-center justify-center bg-[#111111] rounded-full shadow-[0px_3px_32px_-1px_rgba(0,0,0,0.15)] hover:bg-[#333333] active:scale-[0.98] transition-all"
            >
              <span className="text-[16px] md:text-[18px] lg:text-[20px] font-semibold leading-[22px] md:leading-[24px] lg:leading-[26px] text-white font-[Parkinsans]">
                Verify Email Address
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
