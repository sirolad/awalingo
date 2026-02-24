'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { APP_NAME } from '@/lib/brand';

export default function EmailVerification5() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to dashboard or next step after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard'); // or wherever the user should go next
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleContinue = () => {
    router.push('/dashboard'); // or wherever the user should go next
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col px-5 md:px-8 lg:px-12 pt-[120px] md:pt-[140px] lg:pt-[160px] justify-center">
        {/* Success Illustration */}
        <div className="w-[310px] md:w-[380px] lg:w-[450px] h-[300px] md:h-[360px] lg:h-[420px] mb-11 md:mb-14 lg:mb-16 relative mx-auto">
          <Image
            src="/assets/email-verification/email-verified.png"
            alt="Email verified illustration"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="mx-auto w-full max-w-[390px] md:max-w-[480px] lg:max-w-[560px] text-center">
          {/* Success Message */}
          <div className="mb-8 md:mb-10 lg:mb-12">
            <h1 className="text-[28px] md:text-[32px] lg:text-[36px] font-medium leading-[34px] md:leading-[38px] lg:leading-[42px] text-[#292929] font-[Parkinsans] mb-4 md:mb-5 lg:mb-6">
              Email Verified Successfully!
            </h1>
            <p className="text-[16px] md:text-[18px] lg:text-[20px] font-normal leading-[20px] md:leading-[24px] lg:leading-[28px] text-[#656565] font-[Metropolis] max-w-md md:max-w-lg lg:max-w-xl mx-auto">
              Your email address has been verified. You can now access all
              features of your {APP_NAME} account.
            </p>
          </div>

          {/* Loading indicator for auto-redirect */}
          <div className="mb-6 md:mb-8 lg:mb-10">
            <div className="flex justify-center items-center gap-2 md:gap-3 text-[#656565]">
              <div className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 border-2 md:border-3 border-[#656565] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[14px] md:text-[16px] lg:text-[18px] font-normal font-[Metropolis]">
                Redirecting to your dashboard...
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="mt-8 md:mt-10 lg:mt-12 pb-6 md:pb-8 lg:pb-10 px-5 md:px-8 lg:px-12">
          <div className="max-w-[390px] md:max-w-[480px] lg:max-w-[560px] mx-auto">
            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full h-[58px] md:h-[64px] lg:h-[70px] flex items-center justify-center rounded-full bg-[#111111] shadow-[0px_3px_32px_-1px_rgba(0,0,0,0.15)] transition-all hover:bg-[#333333] active:scale-[0.98]"
            >
              <span className="text-[16px] md:text-[18px] lg:text-[20px] font-semibold leading-[22px] md:leading-[24px] lg:leading-[26px] text-white font-[Parkinsans]">
                Continue to Dashboard
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
