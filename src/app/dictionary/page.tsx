'use client';

import { useState, useEffect } from 'react';
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

interface DictionaryWord {
  id: string;
  translation: string;
  englishWord: string;
  definition: string;
  context?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isFavorite: boolean;
  usage: number;
  translations?: {
    id: string;
    communityWord: string;
    audioUrl?: string;
    votes: number;
  }[];
}

export default function DictionaryPage() {
  const router = useRouter();
  const { appUser, isLoading: authLoading, userNeoCommunity } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [currentAlphabet, setCurrentAlphabet] = useState('A');
  const [activeLanguage, setActiveLanguage] = useState<'community' | 'english'>(
    'community'
  );
  const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleGoBack = () => {
    router.push('/home');
  };

  useEffect(() => {
    // Wait for auth check to complete
    if (authLoading) return;

    if (!appUser) {
      router.push('/signin');
      return;
    }

    loadDictionaryWords();
    setLoading(false);
  }, [router, appUser, authLoading]);

  const loadDictionaryWords = () => {
    const mockWords: DictionaryWord[] = [
      {
        id: '1',
        translation: 'Bookumaaki',
        englishWord: 'BookMark',
        definition:
          'A piece of thick paper, leather, or plastic that you put between the pages of a book so that you can find a page again quickly.',
        context: 'I use a bookmark to save my place in the book',
        category: 'abstract',
        difficulty: 'beginner',
        isFavorite: true,
        usage: 245,
        translations: [
          {
            id: '1a',
            communityWord: 'Bookumaaki',
            audioUrl: 'https://example.com/audio/bookumaaki.mp3',
            votes: 10,
          },
          {
            id: '1b',
            communityWord: 'Booki',
            audioUrl: 'https://example.com/audio/booki.mp3',
            votes: 7,
          },
          {
            id: '1c',
            communityWord: 'Booko',
            audioUrl: 'https://example.com/audio/booko.mp3',
            votes: 5,
          },
        ],
      },
      {
        id: '2',
        translation: 'Igo',
        englishWord: 'Bottle',
        definition:
          'A container, typically made of glass or plastic, with a narrow neck, used for storing drinks or other liquids',
        context: 'She drank water from the bottle',
        category: 'abstract',
        difficulty: 'intermediate',
        isFavorite: false,
        usage: 189,
        translations: [
          {
            id: '2a',
            communityWord: 'Igo',
            audioUrl: 'https://example.com/audio/igo.mp3',
            votes: 8,
          },
          {
            id: '2b',
            communityWord: 'Igolu',
            audioUrl: 'https://example.com/audio/igolu.mp3',
            votes: 6,
          },
        ],
      },
      {
        id: '3',
        translation: 'Bodipo',
        englishWord: 'Backpack',
        definition:
          "A bag with shoulder straps that allow it to be carried on one's back, typically used by students or hikers to carry books or supplies",
        context: 'He packed his lunch in his backpack',
        category: 'appearance',
        difficulty: 'beginner',
        isFavorite: true,
        usage: 310,
        translations: [
          {
            id: '3a',
            communityWord: 'Bodipo',
            audioUrl: 'https://example.com/audio/bodipo.mp3',
            votes: 12,
          },
          {
            id: '3b',
            communityWord: 'Bodipolu',
            audioUrl: 'https://example.com/audio/bodipolu.mp3',
            votes: 9,
          },
        ],
      },
      {
        id: '4',
        translation: 'Bodipo lilu',
        englishWord: 'Briefcase',
        definition:
          'A flat, rectangular container with a handle, used for carrying books, papers, or a laptop, typically used by professionals',
        context: 'The lawyer carried important documents in his briefcase',
        category: 'abstract',
        difficulty: 'advanced',
        isFavorite: false,
        usage: 95,
        translations: [
          {
            id: '4a',
            communityWord: 'Bodipo lilu',
            audioUrl: 'https://example.com/audio/bodipolilu.mp3',
            votes: 4,
          },
        ],
      },
      {
        id: '5',
        translation: 'Bata',
        englishWord: 'Boot',
        definition:
          'A sturdy item of footwear covering the foot and ankle, and sometimes extending up to the knee or hip, typically made of leather or rubber',
        context: 'She wore boots to protect her feet from the snow',
        category: 'appearance',
        difficulty: 'intermediate',
        isFavorite: false,
        usage: 150,
        translations: [
          {
            id: '5a',
            communityWord: 'Bata',
            audioUrl: 'https://example.com/audio/bata.mp3',
            votes: 7,
          },
          {
            id: '5b',
            communityWord: 'Batalilu',
            audioUrl: 'https://example.com/audio/batalilu.mp3',
            votes: 3,
          },
          {
            id: '5c',
            communityWord: 'Bato',
            audioUrl: 'https://example.com/audio/bato.mp3',
            votes: 2,
          },
        ],
      },
      {
        id: '6',
        translation: 'Bata lilu',
        englishWord: 'Boots',
        definition:
          'A pair of sturdy items of footwear covering the foot and ankle, and sometimes extending up to the knee or hip, typically made of leather or rubber',
        context: 'She wore boots to protect her feet from the snow',
        category: 'appearance',
        difficulty: 'intermediate',
        isFavorite: false,
        usage: 150,
        translations: [
          {
            id: '6a',
            communityWord: 'Bata lilu',
            audioUrl: 'https://example.com/audio/batalilu.mp3',
            votes: 5,
          },
        ],
      },
      {
        id: '7',
        translation: 'Abokiti',
        englishWord: 'Aboriginal',
        definition:
          'A person, typically a member of a community, who is the original inhabitant of a country or region, especially one who has been displaced or marginalized by colonization or migration.',
        context: 'The aboriginal people have a rich cultural heritage',
        category: 'abstract',
        difficulty: 'advanced',
        isFavorite: false,
        usage: 75,
        translations: [
          {
            id: '7a',
            communityWord: 'Abokiti',
            audioUrl: 'https://example.com/audio/abokiti.mp3',
            votes: 6,
          },
          {
            id: '7b',
            communityWord: 'Abokitulilu',
            audioUrl: 'https://example.com/audio/abokitulilu.mp3',
            votes: 4,
          },
        ],
      },
      {
        id: '8',
        translation: 'Aja',
        englishWord: 'Apple',
        definition:
          'A round fruit with red or green skin and a whitish interior, typically sweet and crisp, grown on apple trees.',
        context: 'She ate an apple as a healthy snack',
        category: 'abstract',
        difficulty: 'beginner',
        isFavorite: true,
        usage: 400,
        translations: [
          {
            id: '8a',
            communityWord: 'Aja',
            audioUrl: 'https://example.com/audio/aja.mp3',
            votes: 15,
          },
          {
            id: '8b',
            communityWord: 'Ajalilu',
            audioUrl: 'https://example.com/audio/ajalilu.mp3',
            votes: 10,
          },
        ],
      },
      {
        id: '9',
        translation: 'Aso',
        englishWord: 'Apron',
        definition:
          "A protective garment worn over the front of one's clothes and tied at the back, typically used while cooking or cleaning to keep clothes clean.",
        context: 'She wore an apron while baking cookies',
        category: 'appearance',
        difficulty: 'intermediate',
        isFavorite: false,
        usage: 120,
        translations: [
          {
            id: '9a',
            communityWord: 'Aso',
            audioUrl: 'https://example.com/audio/aso.mp3',
            votes: 8,
          },
        ],
      },
      {
        id: '10',
        translation: 'Awo',
        englishWord: 'Arrow',
        definition:
          'A thin, pointed missile that is shot from a bow, typically made of wood or carbon fiber with a metal tip and feathers at the back for stability during flight.',
        context: 'The archer aimed his arrow at the target',
        category: 'appearance',
        difficulty: 'advanced',
        isFavorite: false,
        usage: 60,
        translations: [
          {
            id: '10a',
            communityWord: 'Awo',
            audioUrl: 'https://example.com/audio/awo.mp3',
            votes: 5,
          },
        ],
      },
      {
        id: '11',
        translation: 'Awo lilu',
        englishWord: 'Arrows',
        definition:
          'Thin, pointed missiles that are shot from a bow, typically made of wood or carbon fiber with a metal tip and feathers at the back for stability during flight.',
        context: 'The archer aimed his arrows at the target',
        category: 'appearance',
        difficulty: 'advanced',
        isFavorite: false,
        usage: 60,
        translations: [
          {
            id: '11a',
            communityWord: 'Awo lilu',
            audioUrl: 'https://example.com/audio/awolilu.mp3',
            votes: 3,
          },
          {
            id: '11b',
            communityWord: 'Awolilu',
            audioUrl: 'https://example.com/audio/awolilu.mp3',
            votes: 2,
          },
        ],
      },
      // New Data for C
      {
        id: '12',
        translation: 'Chemela',
        englishWord: 'Camera',
        definition:
          'A device for recording visual images in the form of photographs, film, or video signals.',
        context: 'I took diverse pictures with my camera',
        category: 'technology',
        difficulty: 'beginner',
        isFavorite: true,
        usage: 320,
        translations: [
          {
            id: '12a',
            communityWord: 'Chemela',
            audioUrl: 'https://example.com/audio/chemela.mp3',
            votes: 25,
          },
        ],
      },
      {
        id: '13',
        translation: 'Chokolo',
        englishWord: 'Chocolate',
        definition:
          'A food preparation in the form of a paste or solid block made from roasted and ground cacao seeds, typically sweetened.',
        context: 'The children love chocolate ice cream',
        category: 'food',
        difficulty: 'beginner',
        isFavorite: true,
        usage: 500,
        translations: [],
      },
      // New Data for D
      {
        id: '14',
        translation: 'Dogo',
        englishWord: 'Dog',
        definition:
          'A domesticated carnivorous mammal that typically has a long snout, an acute sense of smell, non-retractable claws, and a barking, howling, or whining voice.',
        context: 'The dog barked at the stranger',
        category: 'animals',
        difficulty: 'beginner',
        isFavorite: true,
        usage: 600,
        translations: [],
      },
      {
        id: '15',
        translation: 'Daramu',
        englishWord: 'Drum',
        definition:
          'A percussion instrument sounded by being struck with sticks or the hands, typically cylindrical, barrel-shaped, or bowl-shaped, with a taut membrane over one or both ends.',
        context: 'He played the drum in the band',
        category: 'music',
        difficulty: 'intermediate',
        isFavorite: false,
        usage: 120,
        translations: [],
      },
      // New Data for E
      {
        id: '16',
        translation: 'Elefanti',
        englishWord: 'Elephant',
        definition:
          'A heavy plant-eating mammal with a prehensile trunk, long curved ivory tusks, and large ears, native to Africa and southern Asia.',
        context: 'The elephant is the largest land animal',
        category: 'animals',
        difficulty: 'intermediate',
        isFavorite: true,
        usage: 220,
        translations: [],
      },
      {
        id: '17',
        translation: 'Egu',
        englishWord: 'Egg',
        definition:
          'An oval or round object laid by a female bird, reptile, fish, or invertebrate, usually containing a developing embryo.',
        context: 'I had boiled eggs for breakfast',
        category: 'food',
        difficulty: 'beginner',
        isFavorite: false,
        usage: 450,
        translations: [],
      },
    ];
    setWords(mockWords);
  };

  const getActiveWord = (word: DictionaryWord) => {
    return activeLanguage === 'english' ? word.englishWord : word.translation;
  };

  const getSecondaryWord = (word: DictionaryWord) => {
    return activeLanguage === 'english' ? word.translation : word.englishWord;
  };

  const toggleLanguage = () => {
    setActiveLanguage(prev => (prev === 'english' ? 'community' : 'english'));
    // Optionally reset alphabet or search when toggling?
    // Let's keep filters, but maybe reset alphabet to match the new language?
    // If I'm on 'B' for 'Bookmark', switching to community 'Bookumaaki' (still B) works.
    // If 'A' for 'Apple', switching to community 'Aja' (still A) works.
    // But 'Aboriginal' -> 'Abokiti' (A->A).
    // 'Dog' -> 'Dogo' (D->D).
    // Most translations often start similarly for cognates, but not always.
    // Let's reset alphabet if filtered list is empty? Or just let user navigate.
    // Simpler: Keep current filters. User can adjust.
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
        word.definition.toLowerCase().includes(searchQuery.toLowerCase());

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
                      // definition={`${word.definition}  eg: ${word.context}`}
                      definition={`${word.definition}`}
                      languageName={
                        activeLanguage === 'english'
                          ? userNeoCommunity?.name || 'Awalingo'
                          : 'English'
                      }
                      index={index}
                      translations={word.translations}
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
