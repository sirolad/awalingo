'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Vote,
  ArrowLeft,
  RefreshCcwDot,
  Recycle,
  Star,
  Wrench,
  TreePalmIcon,
  Brain,
  Circle,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';
import { WordOfTheDay } from '@/components/ui/WordOfTheDay';
import AudioPlayer from '@/components/AudioPlayer';
import { Button } from '@/components/ui/Button';
import { getTermNeos, getTerms } from '@/actions/curateNeo';
import { TermsList } from '@/components/ui/TermsList';

interface CommunitySuggestion {
  id: number;
  text: string;
  type: string;
  audioUrl?: string | null;
  vote: number;
  ratingCount: number;
  ratingScore: number;
}
interface Term {
  id: number;
  text: string;
  partOfSpeech: { name: string };
  concept: { gloss: string | null };
  _count: { neos: number };
}

export default function VotePage() {
  const router = useRouter();
  const { appUser, isLoading: authLoading, userNeoCommunity } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<CommunitySuggestion[]>([]);
  const [myVotes, setMyVotes] = useState<number[]>([2]);
  const [term, setTerm] = useState<Term>({} as Term);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loadSuggestionsTrigger, setLoadSuggestionsTrigger] = useState(true);
  const [isWordOfTheDay, setIsWordOfTheDay] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const wordOfTheDay = searchParams.has('wordoftheday');
    setIsWordOfTheDay(wordOfTheDay);
    if (authLoading) return;

    if (!appUser) {
      router.push('/signin');
      return;
    }
    setLoading(false);
    setMyVotes([20]); // Mock: user has voted for suggestion with id '2'
  }, [router, appUser, authLoading]);

  const loadSuggestions = () => {
    // Mock data for word suggestions
    const mockSuggestions: CommunitySuggestion[] = [
      {
        id: 1,
        text: 'Apo elese meta',
        type: 'popular',
        audioUrl: '/audio/short-11-237304.mp3',
        vote: 2,
        ratingCount: 3,
        ratingScore: 4.5,
      },
      {
        id: 2,
        text: 'Igi meta',
        type: 'adoptive',
        audioUrl: '/audio/short-11-237304.mp3',
        vote: 5,
        ratingCount: 2,
        ratingScore: 3.5,
      },
      {
        id: 3,
        text: 'Aga elese meta',
        type: 'functional',
        audioUrl: '/audio/short-11-237304.mp3',
        vote: 2,
        ratingCount: 4,
        ratingScore: 4.0,
      },
      {
        id: 4,
        text: 'itile meta',
        type: 'root',
        audioUrl: '/audio/short-11-237304.mp3',
        vote: 0,
        ratingCount: 1,
        ratingScore: 2.0,
      },
    ];
    setSuggestions(mockSuggestions);
  };

  useEffect(() => {
    const fetchTerms = async () => {
      console.log('Fetching terms for userNeoCommunity:', userNeoCommunity);
      if (userNeoCommunity != null) {
        let userNeoCommunityId: number;
        if (typeof userNeoCommunity.id === 'number') {
          userNeoCommunityId = userNeoCommunity.id;
        } else {
          userNeoCommunityId = parseInt(userNeoCommunity.id);
        }
        const fetchedTerms = await getTerms(userNeoCommunityId);

        console.log('Fetched terms:', fetchedTerms);
        if (fetchedTerms && fetchedTerms.length > 0) {
          setTerms(fetchedTerms);
          if (isWordOfTheDay) {
            setTerm(fetchedTerms[0]);
          }
        } else {
          loadSuggestions();
        }
        setLoadSuggestionsTrigger(false);
      }
    };
    fetchTerms();
  }, [userNeoCommunity]);

  const setOneTerm = async (t: Term) => {
    setSuggestions([]);
    setIsWordOfTheDay(false);
    setTerm(t);
    const fetchNeo = await getTermNeos(t.id, false, appUser?.id);
    if (fetchNeo != null && fetchNeo.length !== 0) {
      setSuggestions(fetchNeo);
    }
    setLoadSuggestionsTrigger(false);
  };

  if (loading) {
    return (
      <Layout variant="home">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="body-base text-neutral-600 dark:text-neutral-400">
              Loading...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading || authLoading) {
    return (
      <Layout variant="home">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="body-base text-neutral-600 dark:text-neutral-400">
              Loading...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!appUser) {
    return null;
  }

  const handleGoBack = () => {
    router.push('/home');
  };

  const loadFreshSuggestions = async () => {
    setSuggestions([]);
    const fetchSuggestions = await getTermNeos(term.id, true, appUser?.id);
    if (fetchSuggestions != null && fetchSuggestions.length !== 0) {
      setSuggestions(fetchSuggestions);
    }
  };

  const typeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'popular':
        return <Star className="text-neutral-600 dark:text-neutral-400" />;
      case 'adoptive':
        return <Recycle className="text-neutral-600 dark:text-neutral-400" />;
      case 'functional':
        return <Wrench className="text-neutral-600 dark:text-neutral-400" />;
      case 'root':
        return (
          <TreePalmIcon className="text-neutral-600 dark:text-neutral-400" />
        );
      case 'non-conforming':
      case 'creative':
        return <Brain className="text-neutral-600 dark:text-neutral-400" />;
      default:
        return <Circle className="text-neutral-600 dark:text-neutral-400" />;
    }
  };

  const sortedSuggestions = [...suggestions].sort(
    (a, b) => b.ratingScore - a.ratingScore
  );

  return (
    <Layout variant="home">
      <div className="w-full mx-auto px-4 md:px-6 lg:px-8">
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
            Voting Lounge
          </span>
          <div className="md:w-20">
            <MyCommunityTag
              userNeoCommunity={userNeoCommunity}
              user={appUser}
            />
          </div>
        </div>

        {/*desktop view*/}
        <div className="hidden lg:grid grid-cols-[260px_1fr] gap-8 min-h-[70vh]">
          <div>
            <aside className="sticky top-32 self-start">
              <div className="flex flex-col gap-6 bg-white/80 dark:bg-neutral-900/80 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-soft p-6 h-fit mb-5">
                <h3 className="text-lg font-semibold mb-2 text-primary-700 dark:text-primary-300">
                  Leaderboard
                </h3>
                <ul className="flex flex-col gap-2">
                  <li className="flex items-center gap-2 text-base text-neutral-700 dark:text-neutral-200">
                    <span className="font-bold">1.</span> Ada Lovelace{' '}
                    <span className="ml-auto text-primary-600 font-semibold">
                      42
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-base text-neutral-700 dark:text-neutral-200">
                    <span className="font-bold">2.</span> Alan Turing{' '}
                    <span className="ml-auto text-primary-600 font-semibold">
                      37
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-base text-neutral-700 dark:text-neutral-200">
                    <span className="font-bold">3.</span> Grace Hopper{' '}
                    <span className="ml-auto text-primary-600 font-semibold">
                      29
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-6 bg-white/80 dark:bg-neutral-900/80 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-soft p-6 h-fit">
                <h3 className="text-lg font-semibold mb-2 text-primary-700 dark:text-primary-300">
                  Your Stats
                </h3>
                <ul className="flex flex-col gap-2">
                  <li className="flex items-center gap-2 text-base text-neutral-700 dark:text-neutral-200">
                    <span className="font-bold">Votes Cast:</span> 12
                  </li>
                  <li className="flex items-center gap-2 text-base text-neutral-700 dark:text-neutral-200">
                    <span className="font-bold">Words Suggested:</span> 5
                  </li>
                  <li className="flex items-center gap-2 text-base text-neutral-700 dark:text-neutral-200">
                    <span className="font-bold">Communities Joined:</span> 3
                  </li>
                </ul>
              </div>
            </aside>
          </div>
          <main className="flex flex-col gap-8">
            {Object.keys(term).length > 0 ? (
              <>
                <WordOfTheDay
                  word={term?.text || 'Loading...'}
                  definition={
                    term?.concept?.gloss || 'No definition available.'
                  }
                  partOfSpeech={term?.partOfSpeech?.name || 'noun'}
                  showWordOfTheDay={isWordOfTheDay}
                />

                <div className="grid grid-cols-2 gap-6">
                  {sortedSuggestions.slice(0, 10).map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-soft p-6 hover:shadow-lg transition-all hover:scale-[1.03] flex flex-col gap-4 relative group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                          <div className="flex items-center gap-2 body-small md:body-base text-neutral-600 dark:text-neutral-400">
                            <span>{typeIcon(suggestion.type)}</span>
                            <span>{suggestion.text}</span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 body-small md:body-base px-2 md:px-3 py-1 md:py-1.5">
                            <AudioPlayer audioUrl={suggestion.audioUrl || ''} />
                            <Button
                              variant={
                                myVotes.find(id => id == suggestion.id)
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => {
                                // Handle delete action
                              }}
                              className={`rounded-full ${myVotes.find(id => id == suggestion.id) ? 'bg-[#cdffce] text-[#2da529]' : 'border border-primary-500 text-primary-500'}`}
                            >
                              {myVotes.find(id => id == suggestion.id)
                                ? 'Voted'
                                : 'Vote ' + '\u00A0'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {/* Empty state if no suggestions */}
                {suggestions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft p-8 md:p-10 lg:p-12 text-center col-span-full"
                  >
                    <Vote className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-neutral-400 mx-auto mb-4 md:mb-6 lg:mb-8" />
                    <h3 className="heading-4 lg:heading-3 text-neutral-800 dark:text-neutral-200 mb-2 md:mb-3 lg:mb-4">
                      No Suggestions Yet
                    </h3>
                    <p className="body-small md:body-base lg:body-large text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                      Be the first to submit a word suggestion!
                    </p>
                  </motion.div>
                )}
              </>
            ) : (
              <TermsList
                title="Vote for more words!"
                terms={terms}
                onSelectTerm={setOneTerm}
              />
            )}

            <div className="flex flex-row justify-center mt-6 md:mt-8 lg:mt-10">
              <div className="flex  gap-1 flex-row justify-center">
                <Button
                  variant="outline"
                  size="md"
                  disabled={suggestions.length < 11}
                  onClick={loadFreshSuggestions}
                  className="rounded-full"
                >
                  Refresh Neos{' '}
                  <RefreshCcwDot className="ml-2 w-5 h-5 md:w-6 md:h-6" />
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setSuggestions([]);
                    setOneTerm({} as Term);
                  }}
                  className="ml-4 rounded-full"
                >
                  Vote Lounge{' '}
                  <ArrowLeft className="rotate-180 ml-2 w-5 h-5 md:w-6 md:h-6" />
                </Button>
              </div>
            </div>
          </main>
        </div>

        {/* Main Content */}
        <div className="lg:hidden flex-1 space-y-6 md:space-y-8 lg:space-y-10 pb-20 md:pb-8">
          {/* Header Card */}
          {term.text ? (
            <>
              <WordOfTheDay
                word={term?.text || 'Loading...'}
                definition={term?.concept?.gloss || 'No definition available.'}
                partOfSpeech={term?.partOfSpeech?.name || 'noun'}
                showWordOfTheDay={isWordOfTheDay}
              />

              {/* Suggestions List - Responsive Grid */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]">
                {sortedSuggestions.slice(0, 10).map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="mx-6 md:mx-8 lg:mx-10 py-4 md:py-6 lg:py-8 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4 md:mb-6">
                        <div className="flex items-center gap-2 body-small md:body-base text-neutral-600 dark:text-neutral-400">
                          <span>{typeIcon(suggestion.type)}</span>
                          <span>{suggestion.text}</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 body-small md:body-base px-2 md:px-3 py-1 md:py-1.5">
                          <AudioPlayer audioUrl={suggestion.audioUrl || ''} />
                          <Button
                            variant={
                              myVotes.find(id => id == suggestion.id)
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              // Handle delete action
                            }}
                            className={`rounded-full ${myVotes.find(id => id == suggestion.id) ? 'bg-[#cdffce] text-[#2da529]' : 'border border-primary-500 text-primary-500'}`}
                          >
                            {myVotes.find(id => id == suggestion.id)
                              ? 'Voted'
                              : 'Vote ' + '\u00A0'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Empty state if no suggestions */}
              {suggestions.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft p-8 md:p-10 lg:p-12 text-center col-span-full"
                >
                  <Vote className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-neutral-400 mx-auto mb-4 md:mb-6 lg:mb-8" />
                  <h3 className="heading-4 lg:heading-3 text-neutral-800 dark:text-neutral-200 mb-2 md:mb-3 lg:mb-4">
                    No Suggestions Yet
                  </h3>
                  <p className="body-small md:body-base lg:body-large text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                    Be the first to submit a word suggestion!
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            <TermsList
              title="Vote for more words!"
              terms={terms}
              onSelectTerm={setOneTerm}
            />
          )}
          <div className="flex flex-row justify-center mt-6 md:mt-8 lg:mt-10">
            <div className="flex  gap-1 flex-row justify-center">
              <Button
                variant="outline"
                size="md"
                disabled={suggestions.length < 11}
                onClick={loadFreshSuggestions}
                className="rounded-full"
              >
                Refresh Neos{' '}
                <RefreshCcwDot className="ml-2 w-5 h-5 md:w-6 md:h-6" />
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSuggestions([]);
                  setOneTerm({} as Term);
                }}
                className="ml-4 rounded-full"
              >
                Vote Lounge{' '}
                <ArrowLeft className="rotate-180 ml-2 w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
