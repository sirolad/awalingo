'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setMyTargetLanguage } from '@/actions/language';
import { APP_NAME } from '@/lib/brand';
import { ReactCountryFlag } from 'react-country-flag';

interface NeoLanguageOption {
  id: number;
  name: string;
  icon: string | null;
}

interface NeoLanguageProps {
  languages: NeoLanguageOption[];
  initialSelectedId: number | null;
}

export default function NeoLanguage({
  languages,
  initialSelectedId,
}: NeoLanguageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedNeoLanguage, setSelectedNeoLanguage] = useState<number | null>(
    initialSelectedId
  );
  const [neoLanguages] = useState<NeoLanguageOption[]>(languages);

  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    setLoading(true);
    if (!selectedNeoLanguage) {
      toast.error('Please select a Neo Community to proceed.');
      setLoading(false);
      return;
    }
    const selectedLanguage = neoLanguages.find(
      lang => lang.id === selectedNeoLanguage
    );

    await setMyTargetLanguage(selectedNeoLanguage)
      .then(() => {
        setLoading(false);
        toast.success(`Neo Community set to ${selectedLanguage?.name}`);
        router.push('/home');
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
        toast.error('An error occurred while setting Neo Community.');
      });
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      {/* Back Button */}
      <div className="absolute top-12 left-5 z-10">
        <button
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center rounded-full"
        >
          <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
            <path
              d="M20 5H2M2 5L6 1M2 5L6 9"
              stroke="#292929"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-16 pb-6 ">
        <div className="flex-1 flex flex-col justify-center">
          {/* Content Card */}
          <div className="bg-white rounded-3xl border border-[#EFEFEF] p-6 mx-auto w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              {/* Progress Indicators */}
              <div className="flex justify-center items-center space-x-2 mb-6">
                <div className="w-16 h-1 bg-[#D9D9D9] rounded-full"></div>
                <div className="w-16 h-1 bg-[#111111] rounded-full"></div>
              </div>

              <h1 className="text-[24px] font-medium leading-[29px] text-[#292929] font-[Parkinsans] mb-2">
                {`Choose Your ${APP_NAME} Community`}
              </h1>
              <p className="text-[14px] font-normal leading-[14px] text-[#656565] font-[Metropolis]">
                Rep your mother tongue.
              </p>
            </div>

            <div className="space-y-4 mb-8 h-[50vh] overflow-y-auto">
              {neoLanguages.map(language => (
                <button
                  key={language.id}
                  onClick={() => setSelectedNeoLanguage(language.id)}
                  className={`w-full p-4 rounded-lg border flex items-center justify-between transition-colors ${
                    selectedNeoLanguage === language.id
                      ? 'bg-white border-[rgba(17,17,17,0.15)]'
                      : 'bg-white border-[rgba(17,17,17,0.15)]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {language.icon && (
                      <ReactCountryFlag
                        countryCode={language.icon}
                        svg
                        className="w-6 h-6"
                      />
                    )}
                    <span className="text-[14px] font-normal leading-[20px] text-[#111111] font-[Parkinsans]">
                      {language.name.charAt(0).toUpperCase() +
                        language.name.slice(1).toLowerCase()}
                    </span>
                  </div>

                  {/* Radio Button */}
                  <div className="flex items-center">
                    <div
                      className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center ${
                        selectedNeoLanguage === language.id
                          ? 'border-[#111111]'
                          : 'border-[rgba(17,17,17,0.3)]'
                      }`}
                    >
                      {selectedNeoLanguage === language.id && (
                        <div className="w-[10px] h-[10px] bg-[#111111] rounded-full"></div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Next Button */}
        <div className="pt-8 flex justify-center">
          <button
            onClick={handleNext}
            disabled={loading}
            className={
              loading
                ? 'w-full max-w-md h-[58px] flex items-center justify-center bg-[#888888] rounded-full shadow-[0px_3px_32px_-1px_rgba(0,0,0,0.15)]'
                : 'w-full max-w-md h-[58px] flex items-center justify-center bg-[#111111] rounded-full shadow-[0px_3px_32px_-1px_rgba(0,0,0,0.15)]'
            }
          >
            <span className="text-[16px] font-semibold leading-[22px] text-white font-[Parkinsans]">
              {loading ? 'Completing Profile...' : 'Complete Profile'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
