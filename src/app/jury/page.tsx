'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Vote,
  ArrowLeft,
  RefreshCcwDot,
  Star,
  Recycle,
  Wrench,
  Brain,
  Circle,
  TreePalmIcon,
  XIcon,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';
import { WordOfTheDay } from '@/components/ui/WordOfTheDay';
import AudioPlayer from '@/components/AudioPlayer';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  getNeosRatedByMe,
  getTermNeos,
  getTerms,
  rateNeo,
} from '@/actions/curateNeo';

interface ComunitySuggestion {
  id: number;
  ratingCount: number;
  ratingScore: number;
  text: string;
  audioUrl?: string | null;
  type: 'POPULAR' | 'ADOPTIVE' | 'FUNCTIONAL' | 'ROOT' | 'CREATIVE';
  vote: number;
}

interface Term {
  id: number;
  text: string;
  partOfSpeech: { name: string };
  concept: { gloss: string | null };
  _count: { neos: number };
}

interface AnimatedEmojiProps {
  emoji: string;
  label: string;
}

import type { HTMLMotionProps } from 'framer-motion';
import { toast } from 'sonner';
import { TermsList } from '@/components/ui/TermsList';

const AnimatedEmoji = ({
  emoji,
  label,
  ...props
}: AnimatedEmojiProps & HTMLMotionProps<'span'>) => {
  return (
    <motion.span
      role="img"
      aria-label={label}
      style={{ fontSize: '25px', cursor: 'pointer', display: 'inline-block' }}
      // Gamification: "Pop" effect on click
      whileTap={{ scale: 1.5, rotate: 15 }}
      // Subtle hover effect
      whileHover={{ scale: 1.2, y: -5 }}
      // Standard spring transition for a "bouncy" feel
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      {...props}
    >
      {emoji}
    </motion.span>
  );
};

export default function JuryPage() {
  const router = useRouter();
  const { appUser, isLoading: authLoading, userNeoCommunity } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<ComunitySuggestion[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [modalTitle, setModalTitle] = useState(<></>);
  const [modalBody, setModalBody] = useState(<></>);
  const [term, setTerm] = useState<Term>({} as Term);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loadSuggestionsTrigger, setLoadSuggestionsTrigger] = useState(true);
  const [ratedByMe, setRatedByMe] = useState<
    { neoId: number; value: number }[]
  >([]);

  const searchParams = useSearchParams();
  const wordOfTheDay = searchParams.has('wordoftheday');
  const [isWordOfTheDay, setIsWordOfTheDay] = useState(wordOfTheDay);

  useEffect(() => {
    if (authLoading) return;

    if (!appUser) {
      router.push('/signin');
      return;
    }

    setLoading(false);
  }, [router, appUser, authLoading]);

  useEffect(() => {
    const fetchTerms = async () => {
      if (userNeoCommunity != null) {
        let userNeoCommunityId: number;
        if (typeof userNeoCommunity.id === 'number') {
          userNeoCommunityId = userNeoCommunity.id;
        } else {
          userNeoCommunityId = parseInt(userNeoCommunity.id);
        }
        const fetchedTerms = await getTerms(userNeoCommunityId);

        if (fetchedTerms && fetchedTerms.length > 0) {
          setTerms(fetchedTerms);
          if (isWordOfTheDay) {
            setTerm(fetchedTerms[0]);
          }
        } else {
          loadSuggestions();
        }
      }
    };
    fetchTerms();
  }, [userNeoCommunity, loadSuggestionsTrigger]);

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

  useEffect(() => {
    const fetchRatedByMe = async () => {
      if (appUser && suggestions.length > 0) {
        const rated = await getNeosRatedByMe(
          appUser.id,
          suggestions.map(s => s.id)
        );
        setRatedByMe(rated);
      }
    };
    fetchRatedByMe();
  }, [suggestions.length]);

  const loadSuggestions = () => {
    // Mock data for word suggestions
    const mockSuggestions: ComunitySuggestion[] = [
      {
        id: 1,
        text: 'Apo elese meta',
        audioUrl: '/audio/short-11-237304.mp3',
        type: 'POPULAR',
        vote: 0,
        ratingCount: 0,
        ratingScore: 0,
      },
      {
        id: 2,
        text: 'Igi meta',
        audioUrl: '/audio/short-11-237304.mp3',
        type: 'ADOPTIVE',
        vote: 0,
        ratingCount: 0,
        ratingScore: 0,
      },
      {
        id: 3,
        text: 'Aga elese meta',
        audioUrl: '/audio/short-11-237304.mp3',
        type: 'FUNCTIONAL',
        vote: 0,
        ratingCount: 0,
        ratingScore: 0,
      },
      {
        id: 4,
        text: 'itile meta',
        audioUrl: '/audio/short-11-237304.mp3',
        type: 'ROOT',
        vote: 0,
        ratingCount: 0,
        ratingScore: 0,
      },
      {
        id: 5,
        text: 'itile meta',
        audioUrl: '/audio/short-11-237304.mp3',
        type: 'CREATIVE',
        vote: 0,
        ratingCount: 0,
        ratingScore: 0,
      },
    ];
    setSuggestions(mockSuggestions);
  };

  const rejectionReasons = [
    'Bad Text',
    'Bad Audio',
    'Spam',
    'Out of context',
    'Duplicate',
  ];

  const emojis = [
    { char: '❌', label: 'angry', value: 0 },
    { char: '😓', label: 'sweat', value: 1 },
    { char: '😕', label: 'confused', value: 2 },
    { char: '😐', label: 'neutral', value: 3 },
    { char: '😁', label: 'grin', value: 4 },
    { char: '😍', label: 'heart eyes', value: 5 },
  ];

  if (loading) {
    return (
      <Layout variant="home">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading...</p>
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
            <p className="text-neutral-600">Loading...</p>
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

  const rateSuggestion = async (
    suggestionId: number,
    rating: number,
    rejectionReasons?: string[]
  ) => {
    const instantFeedback = ratedByMe.find(r => r.neoId === suggestionId)
      ? setRatedByMe(
          ratedByMe.map(r =>
            r.neoId === suggestionId
              ? { neoId: suggestionId, value: rating }
              : r
          )
        )
      : setRatedByMe([...ratedByMe, { neoId: suggestionId, value: rating }]);
    const result = await rateNeo(
      suggestionId,
      appUser.id,
      rating,
      rejectionReasons ? rejectionReasons.join(', ') : null
    );
    if (result == null) {
      toast.error('Failed to submit your vote. Please try again.');
    } else if (result && result.data) {
      setRatedByMe(result.data);
    }
  };

  // const sortedSuggestions = [...suggestions].sort((a, b) => b.votes - a.votes);
  const typeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'popular':
        return (
          <Star className="w-5 h-5 md:w-6 md:h-6 text-[#111111CC] dark:text-neutral-400" />
        );
      case 'adoptive':
        return (
          <Recycle className="w-5 h-5 md:w-6 md:h-6 text-[#111111CC] dark:text-neutral-400" />
        );
      case 'functional':
        return (
          <Wrench className="w-5 h-5 md:w-6 md:h-6 text-[#111111CC] dark:text-neutral-400" />
        );
      case 'root':
        return (
          <TreePalmIcon className="w-5 h-5 md:w-6 md:h-6 text-[#111111CC] dark:text-neutral-400" />
        );
      case 'creative':
        return (
          <Brain className="w-5 h-5 md:w-6 md:h-6 text-[#111111CC] dark:text-neutral-400" />
        );
      default:
        return (
          <Circle className="w-5 h-5 md:w-6 md:h-6 text-[#111111CC] dark:text-neutral-400" />
        );
    }
  };

  return (
    <>
      {showRejectModal &&
        Modal(modalTitle, modalBody, () => setShowRejectModal(false), false)}
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
            <span className="text-lg md:text-xl lg:text-3xl font-[500] text-[24px] text-neutral-950 dark:text-neutral-50 tracking-tight">
              Jury Board
            </span>
            <div className="md:w-20">
              <MyCommunityTag
                userNeoCommunity={userNeoCommunity}
                user={appUser}
              />
            </div>
          </div>

          {/* Desktop creative layout */}
          <div className="hidden lg:grid grid-cols-[260px_1fr] gap-8 min-h-[70vh]">
            {/* Left sticky info panel */}
            <div>
              <aside className="sticky top-32 self-start">
                <div className="flex flex-col gap-6 bg-white/80 dark:bg-neutral-900/80 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-soft p-6 h-fit">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary-700 dark:text-primary-300">
                      Your Progress
                    </h3>
                    <div className="flex flex-col gap-2">
                      <span className="text-base text-neutral-700 dark:text-neutral-200">
                        Neos Rated: <b>{ratedByMe.length}</b>
                      </span>
                      <span className="text-base text-neutral-700 dark:text-neutral-200">
                        Community: <b>{userNeoCommunity?.name || '—'}</b>
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-base font-medium mb-1 text-neutral-800 dark:text-neutral-100">
                      Tips
                    </h4>
                    <ul className="list-disc ml-5 text-sm text-neutral-600 dark:text-neutral-400">
                      <li>Click emojis to rate suggestions</li>
                      <li>Reject inappropriate neos</li>
                      <li>Hover cards for more info</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-6 bg-white/80 dark:bg-neutral-900/80 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-soft p-6 h-fit mt-5">
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
                    <li className="flex items-center gap-2 text-base text-neutral-700 dark:text-neutral-200">
                      <span className="font-bold">4.</span> You{' '}
                      <span className="ml-auto text-primary-600 font-semibold">
                        {ratedByMe.length}
                      </span>
                    </li>
                  </ul>
                  <div className="mt-4">
                    <h4 className="text-base font-medium mb-1 text-neutral-800 dark:text-neutral-100">
                      Recent Activity
                    </h4>
                    <ul className="list-disc ml-5 text-sm text-neutral-600 dark:text-neutral-400">
                      <li>Neo "Apo elese meta" rated by Ada</li>
                      <li>Neo "Igi meta" rejected by Alan</li>
                      <li>Neo "Aga elese meta" added</li>
                    </ul>
                  </div>
                </div>
              </aside>
            </div>

            {/* Main content: animated grid cards */}
            <main className="flex flex-col gap-8">
              {Object.keys(term).length > 0 ? (
                <>
                  <WordOfTheDay
                    word={term.text || 'Loading...'}
                    definition={
                      term.concept?.gloss || 'No definition available.'
                    }
                    partOfSpeech={term.partOfSpeech?.name || 'noun'}
                    showWordOfTheDay={isWordOfTheDay}
                  />
                  <div className="grid grid-cols-2 gap-6">
                    {suggestions.slice(0, 10).map((suggestion, index) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.07 }}
                        className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-soft p-6 hover:shadow-lg transition-all hover:scale-[1.03] flex flex-col gap-4 relative group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-base text-neutral-600 dark:text-neutral-400">
                            {typeIcon(suggestion.type)}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                              {suggestion.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-base px-3 py-1.5">
                            {ratedByMe.filter(r => r.neoId === suggestion.id)
                              .length > 0 ? (
                              <span>
                                <AnimatedEmoji
                                  emoji={
                                    emojis.find(
                                      e =>
                                        e.value ===
                                        ratedByMe.find(
                                          r => r.neoId === suggestion.id
                                        )?.value
                                    )?.char || ''
                                  }
                                  label={
                                    emojis.find(
                                      e =>
                                        e.value ===
                                        ratedByMe.find(
                                          r => r.neoId === suggestion.id
                                        )?.value
                                    )?.label || ''
                                  }
                                />
                              </span>
                            ) : null}
                            <AudioPlayer audioUrl={suggestion.audioUrl || ''} />
                          </div>
                        </div>
                        <div className="flex items-center gap-5 mt-2">
                          <XIcon
                            className="w-6 h-6 text-[#A30202] dark:text-[#FF6B6B] cursor-pointer opacity-80 group-hover:opacity-100"
                            onClick={() => {
                              setModalTitle(<>Reject this Neo?</>);
                              setModalBody(
                                <div className="text-left">
                                  <div className="flex flex-col gap-2 justify-start items-start">
                                    {rejectionReasons.map(reason => (
                                      <div
                                        key={reason}
                                        className="text-sm text-neutral-700"
                                      >
                                        <input
                                          name="rejectionReasons[]"
                                          type="checkbox"
                                          value={reason}
                                        />{' '}
                                        {reason}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex flex-row w-full justify-center pb-2 mt-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowRejectModal(false)}
                                      className="ml-2 mt-2 lg:mt-6 h-10 lg:h-12 text-lg font-medium rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all w-50"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => {
                                        setShowRejectModal(false);
                                        rateSuggestion(
                                          suggestion.id,
                                          0,
                                          rejectionReasons.filter(
                                            reason =>
                                              (
                                                document.querySelector(
                                                  `input[name="rejectionReasons[]"][value="${reason}"]`
                                                ) as HTMLInputElement
                                              ).checked
                                          )
                                        );
                                      }}
                                      className="mr-2 mt-2 lg:mt-6 ml-4 h-10 lg:h-12 text-lg font-medium rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all w-50"
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              );
                              setShowRejectModal(true);
                            }}
                          />
                          {emojis.slice(1).map(e => (
                            <AnimatedEmoji
                              key={e.value}
                              emoji={e.char}
                              label={e.label}
                              onClick={() =>
                                rateSuggestion(suggestion.id, e.value)
                              }
                            />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {suggestions.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-soft p-12 text-center col-span-full"
                    >
                      <Vote className="w-24 h-24 text-neutral-400 dark:text-neutral-500 mx-auto mb-8" />
                      <h3 className="text-2xl font-medium text-neutral-800 dark:text-neutral-50 mb-4">
                        No Suggestions Yet
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-lg max-w-md mx-auto">
                        Be the first to submit a word suggestion!
                      </p>
                    </motion.div>
                  )}
                </>
              ) : (
                <TermsList
                  title="Suggestions to rate"
                  terms={terms}
                  onSelectTerm={setOneTerm}
                />
              )}
              <div className="flex flex-row justify-center mt-10">
                <div className="flex gap-2 flex-row justify-center">
                  <Button
                    variant="outline"
                    size="md"
                    disabled={suggestions.length < 11}
                    onClick={loadFreshSuggestions}
                    className="rounded-full"
                  >
                    Refresh Neos <RefreshCcwDot className="ml-2 w-6 h-6" />
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="ml-4 rounded-full"
                    onClick={() => {
                      setSuggestions([]);
                      setOneTerm({} as Term);
                    }}
                  >
                    Jury Lounge{' '}
                    <ArrowLeft className="rotate-180 ml-2 w-6 h-6" />
                  </Button>
                </div>
              </div>
            </main>
          </div>

          {/* Mobile/tablet version: original layout */}
          <div className="lg:hidden">
            {term.text ? (
              <>
                <WordOfTheDay
                  word={term.text || 'Loading...'}
                  definition={term.concept?.gloss || 'No definition available.'}
                  partOfSpeech={term.partOfSpeech?.name || 'noun'}
                  showWordOfTheDay={isWordOfTheDay}
                />
                <div className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]">
                  {suggestions.slice(0, 10).map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="mx-6 md:mx-8 lg:mx-10 py-4 md:py-6 lg:py-8 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                    >
                      {/* ...existing code... */}
                      <div>
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                          <div className="flex items-center gap-2 text-sm md:text-base text-neutral-600 dark:text-neutral-400">
                            {typeIcon(suggestion.type)}
                            <span>{suggestion.text}</span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 text-sm md:text-base px-2 md:px-3 py-1 md:py-1.5 ">
                            {ratedByMe.filter(r => r.neoId === suggestion.id)
                              .length > 0 ? (
                              <span>
                                <AnimatedEmoji
                                  emoji={
                                    emojis.find(
                                      e =>
                                        e.value ===
                                        ratedByMe.find(
                                          r => r.neoId === suggestion.id
                                        )?.value
                                    )?.char || ''
                                  }
                                  label={
                                    emojis.find(
                                      e =>
                                        e.value ===
                                        ratedByMe.find(
                                          r => r.neoId === suggestion.id
                                        )?.value
                                    )?.label || ''
                                  }
                                />
                              </span>
                            ) : null}
                            <AudioPlayer audioUrl={suggestion.audioUrl || ''} />
                            {/* Placeholder for reject action */}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <XIcon
                            className="w-5 h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-[#A30202] dark:text-[#FF6B6B] cursor-pointer"
                            onClick={() => {
                              setModalTitle(<>Reject this Neo?</>);
                              setModalBody(
                                <div className="text-left">
                                  <div className="flex flex-col gap-2 justify-start items-start">
                                    {rejectionReasons.map(reason => (
                                      <div
                                        key={reason}
                                        className="text-sm text-neutral-700"
                                      >
                                        <input
                                          name="rejectionReasons[]"
                                          type="checkbox"
                                          value={reason}
                                        />{' '}
                                        {reason}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex flex-row w-full justify-center pb-2 mt-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowRejectModal(false)}
                                      className="ml-2 mt-2 md:mt-4 lg:mt-6 h-8 md:h-10 lg:h-12 text-base md:text-lg font-medium rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all w-50"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => {
                                        setShowRejectModal(false);
                                        rateSuggestion(
                                          suggestion.id,
                                          0,
                                          rejectionReasons.filter(
                                            reason =>
                                              (
                                                document.querySelector(
                                                  `input[name="rejectionReasons[]"][value="${reason}"]`
                                                ) as HTMLInputElement
                                              ).checked
                                          )
                                        );
                                      }}
                                      className="mr-2 mt-2 md:mt-4 lg:mt-6 ml-4 h-8 md:h-10 lg:h-12 text-base md:text-lg font-medium rounded-full md:rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all w-50"
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              );
                              setShowRejectModal(true);
                            }}
                          />
                          {emojis.slice(1).map(e => (
                            <AnimatedEmoji
                              key={e.value}
                              emoji={e.char}
                              label={e.label}
                              onClick={() =>
                                rateSuggestion(suggestion.id, e.value)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {suggestions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-soft p-8 md:p-10 lg:p-12 text-center col-span-full"
                  >
                    <Vote className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-neutral-400 dark:text-neutral-500 mx-auto mb-4 md:mb-6 lg:mb-8" />
                    <h3 className="text-lg md:text-xl lg:text-2xl font-medium text-neutral-800 dark:text-neutral-50 mb-2 md:mb-3 lg:mb-4">
                      No Suggestions Yet
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base lg:text-lg max-w-md mx-auto">
                      Be the first to submit a word suggestion!
                    </p>
                  </motion.div>
                )}
              </>
            ) : (
              <TermsList
                title="Suggestions to rate"
                terms={terms}
                onSelectTerm={setOneTerm}
              />
            )}
            <div className="flex flex-row justify-center mt-6 md:mt-8 lg:mt-10">
              <div className="flex gap-1 flex-row justify-center">
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
                  className="ml-4 rounded-full"
                  onClick={() => {
                    setSuggestions([]);
                    setOneTerm({} as Term);
                  }}
                >
                  Jury Lounge{' '}
                  <ArrowLeft className="rotate-180 ml-2 w-5 h-5 md:w-6 md:h-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
