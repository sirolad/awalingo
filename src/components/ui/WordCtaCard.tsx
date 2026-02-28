import { motion } from 'framer-motion';
import { Button } from './Button';
import { BookPlus, Gavel, Lightbulb, Vote } from 'lucide-react';

export function CtaCard({
  title,
  subTitle,
  word,
  ctaText,
  variant,
  onHandleClick,
}: {
  title: string;
  subTitle: string;
  word: string;
  ctaText?: string;
  variant: 'suggest' | 'vote' | 'request' | 'review' | 'jury';
  onHandleClick: () => void;
}) {
  switch (variant) {
    case 'jury':
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Card Header */}
          <div className="p-6 md:p-8 lg:p-10 pb-4 md:pb-6 lg:pb-8">
            <span className="card-title md:heading-4 lg:heading-3 text-neutral-950 dark:text-neutral-50 mb-1 md:mb-2">
              {title}
            </span>
            <p className="body-small md:body-base lg:body-large text-neutral-600 dark:text-neutral-400">
              {subTitle}
            </p>
          </div>

          {/* Word Display */}
          <div
            className={`mx-6 md:mx-8 lg:mx-10 mb-6 md:mb-8 lg:mb-10 bg-[#f0f0f0] dark:bg-[#1a1a1a] border-[#dcdcdc] dark:border-[#333333] border rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8`}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
              <div
                className={`px-3 md:px-4 lg:px-5 py-1 md:py-1.5 lg:py-2 rounded-full body-xs md:body-small lg:body-base font-medium bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#292929] dark:text-[#f0f0f0]`}
              >
                {ctaText || 'Your dashboard'}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={onHandleClick}
                leftIcon={
                  <Gavel className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                }
                className="h-8 md:h-10 lg:h-12 px-4 md:px-6 lg:px-8 rounded-2xl md:rounded-3xl body-xs md:body-small lg:body-base font-semibold hover:scale-105 active:scale-95 transition-transform"
              >
                Dashboard
              </Button>
            </div>
            <span className="heading-4 md:heading-3 lg:heading-2 font-light text-neutral-950 dark:text-neutral-50">
              {word}
            </span>
          </div>
        </motion.div>
      );
    case 'suggest':
    default:
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Card Header */}
          <div className="p-6 md:p-8 lg:p-10 pb-4 md:pb-6 lg:pb-8">
            <span className="card-title md:heading-4 lg:heading-3 text-neutral-950 dark:text-neutral-50 mb-1 md:mb-2">
              {title}
            </span>
            <p className="body-small md:body-base lg:body-large text-neutral-600 dark:text-neutral-400">
              {subTitle}
            </p>
          </div>

          {/* Word Display */}
          <div
            className={`mx-6 md:mx-8 lg:mx-10 mb-6 md:mb-8 lg:mb-10 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 border rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8`}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
              <div
                className={`px-3 md:px-4 lg:px-5 py-1 md:py-1.5 lg:py-2 rounded-full body-xs md:body-small lg:body-base font-medium bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200`}
              >
                {ctaText}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={onHandleClick}
                leftIcon={
                  <Lightbulb className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 strokeWidth={3.5} " />
                }
                className="h-8 md:h-10 lg:h-12 px-4 md:px-6 lg:px-8 rounded-2xl md:rounded-3xl body-xs md:body-small lg:body-base font-semibold hover:scale-105 active:scale-95 transition-transform"
              >
                Curate
              </Button>
            </div>
            <span className="heading-4 md:heading-3 lg:heading-2 font-light text-neutral-950 dark:text-neutral-50">
              {word}
            </span>
          </div>
        </motion.div>
      );
    case 'vote':
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Card Header */}
          <div className="p-6 md:p-8 lg:p-10 pb-4 md:pb-6 lg:pb-8">
            <span className="card-title md:heading-4 lg:heading-3 text-neutral-950 dark:text-neutral-50 mb-1 md:mb-2">
              {title}
            </span>
            <p className="body-small md:body-base lg:body-large text-neutral-600 dark:text-neutral-400">
              {subTitle}
            </p>
          </div>

          {/* Word Display */}
          <div
            className={`mx-6 md:mx-8 lg:mx-10 mb-6 md:mb-8 lg:mb-10 bg-[#e4fde4] dark:bg-green-900/30 border-[#c8fac9] dark:border-green-800 border rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8`}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
              <div
                className={`px-3 md:px-4 lg:px-5 py-1 md:py-1.5 lg:py-2 rounded-full body-xs md:body-small lg:body-base font-medium bg-[#e4fde4] dark:bg-green-800/50 text-[#50954d] dark:text-green-300`}
              >
                {ctaText}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={onHandleClick}
                leftIcon={
                  <Vote className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 strokeWidth={3.5} " />
                }
                className="h-8 md:h-10 lg:h-12 px-4 md:px-6 lg:px-8 rounded-2xl md:rounded-3xl body-xs md:body-small lg:body-base font-semibold hover:scale-105 active:scale-95 transition-transform"
              >
                Vote
              </Button>
            </div>
            <span className="heading-4 md:heading-3 lg:heading-2 font-light text-neutral-950 dark:text-neutral-50">
              {word}
            </span>
          </div>
        </motion.div>
      );
    case 'request':
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Card Header */}
          <div className="p-6 md:p-8 lg:p-10 pb-4 md:pb-6 lg:pb-8">
            <span className="card-title md:heading-4 lg:heading-3 text-neutral-950 dark:text-neutral-50 mb-1 md:mb-2">
              {title}
            </span>
            <p className="body-small md:body-base lg:body-large text-neutral-600 dark:text-neutral-400">
              {subTitle}
            </p>
          </div>

          {/* Word Display */}
          <div
            className={`mx-6 md:mx-8 lg:mx-10 mb-6 md:mb-8 lg:mb-10 bg-[#f8f3fd] dark:bg-purple-900/30 border-[#eaddf7] dark:border-purple-800 border rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8`}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
              <div
                className={`px-3 md:px-4 lg:px-5 py-1 md:py-1.5 lg:py-2 rounded-full body-xs md:body-small lg:body-base font-medium bg-[#f8f3fd] dark:bg-purple-800/50 text-[#292929] dark:text-purple-200`}
              >
                {ctaText}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={onHandleClick}
                leftIcon={
                  <BookPlus className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 strokeWidth={3.5} " />
                }
                className="h-8 md:h-10 lg:h-12 px-4 md:px-6 lg:px-8 rounded-2xl md:rounded-3xl body-xs md:body-small lg:body-base font-semibold hover:scale-105 active:scale-95 transition-transform"
              >
                Request
              </Button>
            </div>
            <span className="body-small md:body-base lg:heading-2 font-light text-[#6826af] dark:text-purple-300">
              {word}
            </span>
          </div>
        </motion.div>
      );
    case 'review':
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Card Header */}
          <div className="p-6 md:p-8 lg:p-10 pb-4 md:pb-6 lg:pb-8">
            <span className="card-title md:heading-4 lg:heading-3 text-neutral-950 dark:text-neutral-50 mb-1 md:mb-2">
              {title}
            </span>
            <p className="body-small md:body-base lg:body-large text-neutral-600 dark:text-neutral-400">
              {subTitle}
            </p>
          </div>

          {/* Review Display */}
          <div
            className={`mx-6 md:mx-8 lg:mx-10 mb-6 md:mb-8 lg:mb-10 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 border rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8`}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
              <div
                className={`px-3 md:px-4 lg:px-5 py-1 md:py-1.5 lg:py-2 rounded-full body-xs md:body-small lg:body-base font-medium bg-indigo-100 dark:bg-indigo-800/50 text-indigo-800 dark:text-indigo-200`}
              >
                {ctaText || 'Pending Review'}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={onHandleClick}
                leftIcon={
                  <Lightbulb className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                }
                className="h-8 md:h-10 lg:h-12 px-4 md:px-6 lg:px-8 rounded-2xl md:rounded-3xl body-xs md:body-small lg:body-base font-semibold hover:scale-105 active:scale-95 transition-transform bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Review
              </Button>
            </div>
            <span className="heading-4 md:heading-3 lg:heading-2 font-light text-neutral-950 dark:text-neutral-50">
              {word}
            </span>
          </div>
        </motion.div>
      );
  }
}
