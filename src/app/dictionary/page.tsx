'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookPlus, SortDescIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitchTag } from '@/components/ui/LanguageSwitchTag';
import { NeoDicoWord } from '@/components/ui/NeoDicoWord';
import { DictionaryPageSkeleton } from '@/components/dictionary/DictionaryPageSkeleton';
import Image from 'next/image';
import { getDictionaryTerms, type DictionaryTerm } from '@/actions/dictionary';

// English language ID is deterministic (seeded with code 'eng').
// We resolve it server-side inside getDictionaryTerms, but for the page we
// need it to swap the active language. Fetched once on mount.
// need it to swap the active language. Fetched once on mount.
export default function DictionaryPage() {
  const router = useRouter();
  const { appUser, isLoading: authLoading, userNeoCommunity } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [words, setWords] = useState<DictionaryTerm[]>([]);
  const [englishLanguageId, setEnglishLanguageId] = useState<number | null>(
    null
  );
  const [currentAlphabet, setCurrentAlphabet] = useState('A');
  const [activeLanguage, setActiveLanguage] = useState<'community' | 'english'>(
    'community'
  );
  const getActiveWord = useCallback((word: DictionaryTerm) => word.text, []);

  const getSecondaryWord = useCallback(
    (word: DictionaryTerm) => word.translation ?? '',
    []
  );

  const alphabets = Array.from(
    new Set(words.map(w => getActiveWord(w).charAt(0).toUpperCase()))
  ).sort((a, b) => a.localeCompare(b));
  const handleGoBack = () => {
    router.push('/home');
  };

  const loadTerms = useCallback(
    async (primaryLanguageId: number, secondaryLanguageId: number) => {
      setLoading(true);
      const data = await getDictionaryTerms(
        primaryLanguageId,
        secondaryLanguageId
      );
      setWords(data);

      // Auto-select the first available alphabet letter if any words exist
      if (data.length > 0) {
        const firstLetter = getActiveWord(data[0]).charAt(0).toUpperCase();
        setCurrentAlphabet(firstLetter);
      } else {
        setCurrentAlphabet('');
      }

      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (authLoading) return;
    if (!appUser) {
      router.push('/signin');
      return;
    }
    if (!userNeoCommunity) return;

    const communityId = Number(userNeoCommunity.id);

    // Resolve English language ID then load terms
    fetch('/api/language/english')
      .then(r => r.json())
      .then((data: { id: number }) => {
        setEnglishLanguageId(data.id);
        // Default: community language as primary view
        loadTerms(communityId, data.id);
      })
      .catch(() => {
        loadTerms(communityId, communityId);
      });
  }, [router, appUser, authLoading, userNeoCommunity, loadTerms]);

  const toggleLanguage = () => {
    if (!userNeoCommunity || !englishLanguageId) return;
    const communityId = Number(userNeoCommunity.id);
    if (activeLanguage === 'community') {
      setActiveLanguage('english');
      loadTerms(englishLanguageId, communityId);
    } else {
      setActiveLanguage('community');
      loadTerms(communityId, englishLanguageId);
    }
  };

  if (loading || authLoading) {
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

  const filteredWords = words
    .filter(word => {
      const displayWord = getActiveWord(word);
      const secondaryWord = getSecondaryWord(word);

      const matchesSearch =
        searchQuery === '' ||
        displayWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
        secondaryWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.meaning.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAlphabet =
        currentAlphabet === '' ||
        displayWord.toUpperCase().startsWith(currentAlphabet.toUpperCase());

      return matchesSearch && matchesAlphabet;
    })
    .sort((a, b) => {
      // Sort alphabetically by the ACTIVE word
      const wordA = getActiveWord(a);
      const wordB = getActiveWord(b);
      return wordA.localeCompare(wordB);
    });

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
