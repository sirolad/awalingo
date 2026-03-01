'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookPlus, SortDescIcon, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitchTag } from '@/components/ui/LanguageSwitchTag';
import { NeoDicoWord } from '@/components/ui/NeoDicoWord';
import { DictionaryPageSkeleton } from '@/components/dictionary/DictionaryPageSkeleton';
import Image from 'next/image';
import {
  getDictionaryTerms,
  getAvailableAlphabets,
  type DictionaryTerm,
} from '@/actions/dictionary';

// English language ID is deterministic (seeded with code 'eng').
// We resolve it server-side inside getDictionaryTerms, but for the page we
// need it to swap the active language. Fetched once on mount.
export default function DictionaryPage() {
  const router = useRouter();
  const { appUser, isLoading: authLoading, userNeoCommunity } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [words, setWords] = useState<DictionaryTerm[]>([]);
  const [alphabets, setAlphabets] = useState<string[]>([]);

  const observerTarget = useRef<HTMLDivElement>(null);
  const skipRef = useRef(0);

  const [englishLanguageId, setEnglishLanguageId] = useState<number | null>(
    null
  );
  const [currentAlphabet, setCurrentAlphabet] = useState('');
  const [activeLanguage, setActiveLanguage] = useState<'community' | 'english'>(
    'community'
  );
  const [initialLoaded, setInitialLoaded] = useState(false);

  const getActiveWord = useCallback((word: DictionaryTerm) => word.text, []);
  const getSecondaryWord = useCallback(
    (word: DictionaryTerm) => word.translation ?? '',
    []
  );

  const handleGoBack = () => {
    router.push('/home');
  };

  // 1. Fetch English ID (Run Once)
  useEffect(() => {
    if (authLoading || !appUser || englishLanguageId) return;
    fetch('/api/language/english')
      .then(r => r.json())
      .then(data => setEnglishLanguageId(data.id))
      .catch(console.error);
  }, [authLoading, appUser, englishLanguageId]);

  // 2. Fetch Alphabets whenever Active Language changes
  useEffect(() => {
    if (!userNeoCommunity || !englishLanguageId) return;
    const communityId = Number(userNeoCommunity.id);
    const primaryId =
      activeLanguage === 'community' ? communityId : englishLanguageId;

    getAvailableAlphabets(primaryId).then(letters => {
      setAlphabets(letters);
      if (!currentAlphabet && letters.length > 0 && !searchQuery) {
        setCurrentAlphabet(letters[0]);
      } else if (currentAlphabet && !letters.includes(currentAlphabet)) {
        setCurrentAlphabet(letters.length > 0 ? letters[0] : '');
      }
      setInitialLoaded(true);
    });
  }, [activeLanguage, userNeoCommunity, englishLanguageId]);

  // 3. Main Fetch for Terms
  const loadTerms = useCallback(
    async (isLoadMore = false) => {
      if (!userNeoCommunity || !englishLanguageId || !initialLoaded) return;

      if (isLoadMore) setLoadingMore(true);
      else {
        setLoading(true);
        skipRef.current = 0; // Reset skip count on new search/filter
      }

      const communityId = Number(userNeoCommunity.id);
      const primaryId =
        activeLanguage === 'community' ? communityId : englishLanguageId;
      const secondaryId =
        activeLanguage === 'community' ? englishLanguageId : communityId;
      const skip = skipRef.current;

      const data = await getDictionaryTerms(primaryId, secondaryId, {
        skip,
        take: 20,
        searchQuery,
        alphabet: currentAlphabet,
      });

      if (isLoadMore) {
        setWords(prev => [...prev, ...data.terms]);
      } else {
        setWords(data.terms);
      }

      setHasMore(data.hasMore);
      skipRef.current = skip + data.terms.length;

      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    },
    [
      userNeoCommunity,
      englishLanguageId,
      initialLoaded,
      activeLanguage,
      searchQuery,
      currentAlphabet,
    ]
  );

  // Trigger main fetch on dependencies (Search, Alphabet, Language)
  useEffect(() => {
    loadTerms(false);
  }, [loadTerms]);

  // Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadTerms(true);
        }
      },
      { threshold: 0.1 } // Fire a bit earlier than 1.0
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadTerms]);

  const toggleLanguage = () => {
    if (!userNeoCommunity || !englishLanguageId) return;
    setActiveLanguage(prev => (prev === 'community' ? 'english' : 'community'));
    setSearchQuery('');
    // currentAlphabet will be reset by the alphabet fetch effect if necessary
  };

  if ((loading && words.length === 0) || authLoading || !initialLoaded) {
    return (
      <Layout variant="home">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between py-4 md:py-6 lg:py-8">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-neutral-950 dark:text-neutral-50 hover:text-primary-800 dark:hover:text-primary-200 transition-colors p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              <span className="body-small md:body-base font-medium hidden lg:block">
                Back
              </span>
            </button>
            <span className="heading-4 text-neutral-950 dark:text-neutral-50">
              AwaDiko {userNeoCommunity ? `${userNeoCommunity.name}` : ''}
            </span>
            <div className="flex-shrink-0">
              <LanguageSwitchTag
                userNeoCommunity={userNeoCommunity}
                user={appUser}
                activeLanguage={activeLanguage}
                onToggle={toggleLanguage}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6 md:space-y-8 lg:space-y-10 pb-20 md:pb-8">
            {/* Search Bar Skeleton */}
            <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse"></div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <DictionaryPageSkeleton />
              </div>
              {/* Alphabet sidebar skeleton */}
              <div className="w-10 h-96 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!appUser) {
    return null;
  }

  const filteredWords = words;

  return (
    <Layout variant="home">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-4 md:py-6 lg:py-8">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-neutral-950 dark:text-neutral-50 hover:text-primary-800 dark:hover:text-primary-200 transition-colors p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 mr-2" />
            <span className="body-small md:body-base font-medium hidden lg:block">
              Back
            </span>
          </button>
          <span className="heading-4 text-neutral-950 dark:text-neutral-50">
            AwaDiko {userNeoCommunity ? `${userNeoCommunity.name}` : ''}
          </span>
          <div className="flex-shrink-0">
            <LanguageSwitchTag
              userNeoCommunity={userNeoCommunity}
              user={appUser}
              activeLanguage={activeLanguage}
              onToggle={toggleLanguage}
            />
          </div>{' '}
          {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6 md:space-y-8 lg:space-y-10 pb-20 md:pb-8">
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={val => {
              setSearchQuery(val);
              setCurrentAlphabet(val.charAt(0).toUpperCase());
            }}
            placeholder={`Search ${activeLanguage === 'english' ? 'English' : userNeoCommunity?.name || 'Community'} words`}
            onClear={() => setSearchQuery('')}
            className="mb-4 md:mb-6 lg:mb-8"
            iconPosition="right"
            rounded={true}
          />

          <div className="flex space-x-4 overflow-x-auto pb-2 mb-4 md:mb-6 lg:mb-8">
            <div className="flex-1 overflow-auto">
              {/* Words List - Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {filteredWords.length > 0 ? (
                  filteredWords.map((word, index) => (
                    //
                    <NeoDicoWord
                      key={word.id}
                      word={getActiveWord(word)}
                      translation={getSecondaryWord(word)}
                      definition={word.meaning}
                      partOfSpeech={word.partOfSpeech}
                      languageName={
                        activeLanguage === 'english'
                          ? userNeoCommunity?.name || 'Awalingo'
                          : 'English'
                      }
                      index={index}
                      translations={
                        word.translation
                          ? [
                              {
                                id: String(word.id),
                                communityWord: word.translation,
                                votes: 0,
                              },
                            ]
                          : []
                      }
                    />
                  ))
                ) : (
                  //Empty State
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft p-10 md:p-16 lg:p-24 text-center col-span-full flex flex-col items-center justify-center min-h-[600px] w-full"
                  >
                    <div className="relative w-full max-w-[400px] md:max-w-[700px] lg:max-w-4xl aspect-[21/9] mb-8 md:mb-12 lg:mb-16">
                      <Image
                        src="/assets/dictionary/404.png"
                        alt="No Results"
                        fill
                        className="object-contain dark:invert dark:brightness-110"
                        priority
                      />
                    </div>
                    <div className="mb-6 max-w-4xl">
                      <h3 className="heading-3 md:heading-2 lg:heading-1 text-neutral-800 dark:text-neutral-200 mb-4 md:mb-6 lg:mb-8">
                        Word Not Found
                      </h3>
                      <p className="body-base md:body-large lg:text-2xl text-neutral-600 dark:text-neutral-400 mb-8 md:mb-12">
                        Kindly nominate a word for your community to suggest
                        Neos for it.
                      </p>
                    </div>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="h-10 md:h-12 px-4 md:px-6 text-sm md:text-base hover:scale-105 active:scale-95 transition-transform"
                      >
                        Clear Search
                      </Button>
                    )}
                  </motion.div>
                )}

                {/* Infinite Scroll Sentinel */}
                {hasMore && (
                  <div
                    ref={observerTarget}
                    className="col-span-full py-8 flex justify-center items-center h-20"
                  >
                    {loadingMore ? (
                      <div className="flex animate-pulse items-center gap-2 text-neutral-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">
                          Loading more words...
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            <div className="w-10 shrink-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors rounded-full flex-row justify-center px-1">
              <div className="flex justify-center py-3 w-full">
                <SortDescIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </div>
              {alphabets.map(letter => (
                <button
                  key={letter}
                  onClick={() => setCurrentAlphabet(letter)}
                  className={`w-full py-1 mb-4 text-sm font-medium transition-colors ${
                    currentAlphabet === letter
                      ? 'border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-full'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {letter}
                  {letter.toLocaleLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Request Neo Floating Button */}
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dictionary/request')}
            className="fixed bottom-24 right-4 md:right-8 z-50 bg-neutral-950 dark:bg-neutral-100 text-white dark:text-neutral-900 px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-button hover:bg-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            <BookPlus className="w-5 h-5" />
            <span className="body-base font-semibold">Request Neo</span>
          </motion.button>
        </div>
      </div>
    </Layout>
  );
}
