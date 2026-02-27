import type { DicoWord } from '@/types';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Lightbulb,
  LineChart,
  Share2,
  VoteIcon,
} from 'lucide-react';
import { SuggestionsRow } from './SugesstionRow';

import { useState } from 'react';
import { Button } from './Button';

export function NeoDicoWord({
  word,
  translation,
  definition,
  partOfSpeech,
  languageName,
  index,
  translations,
}: DicoWord) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = 'Top Suggestions';
  return (
    <motion.div
      key={word}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.03 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-soft overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]"
    >
      <div className={`p-4 bg-white dark:bg-neutral-900`}>
        <div className={`p-2 w-full rounded-xl bg-white dark:bg-neutral-900`}>
          <div className="mb-2 flex justify-between items-center">
            <span className="body-base text-neutral-950 dark:text-neutral-50">
              {word}
            </span>
            <Share2 className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-neutral-600 dark:text-neutral-400 inline-block ml-2 cursor-pointer" />
          </div>
          <div className="mb-1">
            <em className="body-base text-[#A30202] dark:text-red-400 mr-1">
              AwaDiko {languageName}:
            </em>
            <span className="body-base font-medium text-[#111111CC] dark:text-neutral-300">
              {translation}
            </span>
          </div>

          <div className="mb-2">
            <div className="text-caption italic text-neutral-600 dark:text-neutral-400 mb-2">
              <em>{partOfSpeech ?? 'noun'}</em>
            </div>
            <p className="body-small dark:text-neutral-300">{definition}</p>
          </div>
          {/* Suggestions Dropdown */}
          <div className="relative w-full border-[#EFEFEF] dark:border-neutral-700 border bg-[#fafafa] dark:bg-neutral-800 rounded-lg">
            {/* Trigger Div */}
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center w-full justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all"
            >
              <div className="relative">
                <LineChart className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-neutral-500 pointer-events-none" />
                <span className="body-small font-medium w-full py-[25px] pl-10 dark:text-neutral-200">
                  {selected}
                </span>
              </div>
              <ChevronDown
                className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                size={20}
              />
            </div>

            {/* Expandable Content Area */}
            <div
              className={`w-full
                grid transition-all duration-300 ease-in-out
                ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}
            `}
            >
              <div className="overflow-hidden border dark:border-neutral-700">
                {translations?.map((translation_, index) => (
                  <SuggestionsRow
                    key={translation_.id}
                    suggestion={translation_}
                    index={index}
                  />
                ))}
                <div className="flex flex-row w-full justify-center pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    // onClick={handleGoBack}
                    className="ml-2 mt-2 md:mt-4 lg:mt-6 h-8 md:h-10 lg:h-12 text-base md:text-lg font-medium rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all w-50"
                  >
                    <Lightbulb className="w-5 h-5" /> Curate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    // onClick={handleSubmitAnother}
                    className="mr-2 mt-2 md:mt-4 lg:mt-6 ml-4 h-8 md:h-10 lg:h-12 text-base md:text-lg font-medium rounded-full md:rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all w-50"
                  >
                    <VoteIcon className="w-5 h-5" /> Vote
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
