'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Brain,
  Check,
  Circle,
  Plus,
  Recycle,
  RefreshCcwDot,
  Star,
  TreePalmIcon,
  Wrench,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { WordOfTheDay } from '@/components/ui/WordOfTheDay';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';
import { Modal } from '@/components/ui/Modal';
import SuggestInput from '@/components/ui/SuggestInput';
import { curateNeo, getTerms } from '@/actions/curateNeo';
import { toast } from 'sonner';
import { TermsList } from '@/components/ui/TermsList';

interface Term {
  id: number;
  text: string;
  partOfSpeech: { name: string };
  concept: { gloss: string | null };
  _count: { neos: number };
}

export default function SuggestPage() {
  const router = useRouter();

  const { userNeoCommunity, appUser } = useAuth();
  const [availableNeoSlots, setAvailableNeoSlots] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [term, setTerm] = useState<Term>({} as Term);
  const [terms, setTerms] = useState<Term[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState(<></>);
  const [modalBody, setModalBody] = useState(<></>);
  const [loadSuggestionsTrigger, setLoadSuggestionsTrigger] = useState(true);
  const [suggestions, setSuggestions] = useState<
    {
      type: string;
      description: string;
      text: string;
      audioUrl: string | null;
      error: string | null;
    }[]
  >([]);
  const [state, formAction] = useActionState(curateNeo, {
    success: false,
    message: '',
  });
  const prevStateRef = useRef(state);

  useEffect(() => {
    const fetchTerms = async () => {
      if (userNeoCommunity != null) {
        let userNeoCommunityId: number;
        if (typeof userNeoCommunity.id === 'number') {
          userNeoCommunityId = userNeoCommunity.id;
        } else {
          userNeoCommunityId = parseInt(userNeoCommunity.id);
        }
        console.log('User Neo Community ID:', userNeoCommunityId, appUser?.id);
        const fetchedTerms = await getTerms(
          userNeoCommunityId,
          appUser?.id || ''
        );
        if (fetchedTerms.length > 0) {
          setTerms(fetchedTerms);
        }
      }
      setLoadSuggestionsTrigger(false);
    };
    fetchTerms();
  }, [userNeoCommunity, loadSuggestionsTrigger]);

  useEffect(() => {
    if (state !== prevStateRef.current && !state.success && state.message) {
      state.failedSuggestions?.forEach(failedSuggestion => {
        const position = failedSuggestion.index;
        let errorMessage = '';
        for (const field in failedSuggestion.errors) {
          errorMessage += `${failedSuggestion.errors[field].join(', ')}; `;
        }

        setSuggestions(prev =>
          prev.map((s, i) =>
            i === position ? { ...s, error: errorMessage } : s
          )
        );
      });

      toast.error(state.message);
      setSubmitting(false);
    }
    // Dispatch success event for external button
    if (state !== prevStateRef.current && state.success) {
      toast.success(state.message);
      setSubmitted(true);
      setSubmitting(false);
      setSuggestions([
        {
          type: '',
          description:
            'Please select a suggestion type and provide your suggestion for the word of the day.',
          text: '',
          audioUrl: null,
          error: null,
        },
      ]);
      window.dispatchEvent(new Event('suggestions-submitted'));
    }
    prevStateRef.current = state;
  }, [state]);

  const typeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'popular':
        return <Star className="text-[#111111CC] dark:text-[#FFFFFFCC]" />;
      case 'adoptive':
        return <Recycle className="text-[#111111CC] dark:text-[#FFFFFFCC]" />;
      case 'functional':
        return <Wrench className="text-[#111111CC] dark:text-[#FFFFFFCC]" />;
      case 'root':
        return (
          <TreePalmIcon className="text-[#111111CC] dark:text-[#FFFFFFCC]" />
        );
      case 'non-conforming':
      case 'creative':
        return <Brain className="text-[#111111CC] dark:text-[#FFFFFFCC]" />;
      default:
        return <Circle className="text-[#111111CC] dark:text-[#FFFFFFCC]" />;
    }
  };

  const getDescription = (type: string) => {
    switch (type.toLowerCase()) {
      case 'popular':
        return 'Suggest an existing Neo. What does your community currently call the root word?';
      case 'adoptive':
        return 'Suggest a word that your community has adopted from another source.';
      case 'functional':
        return 'Suggest a word that serves a specific function or purpose within your community.';
      case 'root':
        return 'Suggest a word that represents the root or origin of a concept within your community.';
      case 'creative':
        return 'Suggest a word that is innovative or imaginative within your community.';
      default:
        return 'Suggest a word that does not fit into any specific category.';
    }
  };

  const handleGoBack = () => {
    router.push('/home');
  };

  const handleSubmitAnother = () => {
    setSubmitted(false);
  };

  const setOneTerm = async (t: Term) => {
    setSuggestions([]);
    setTerm(t);
    if (t?._count?.neos >= 5) {
      toast(
        'Your can only suggest 5 neos per word, click "Next Words" to explore other terms',
        {
          description:
            'You have made suggestions for all available terms today.',
          duration: 10000,
        }
      );
      setTerm(t);
      setSuggestions([]);
      setAvailableNeoSlots(0);
      return;
    } else if (t) {
      setSuggestions([
        {
          type: '',
          description:
            'Please select a suggestion type and provide your suggestion for the word of the day.',
          text: '',
          audioUrl: null,
          error: null,
        },
      ]);
      setTerm(t);
      setAvailableNeoSlots(5 - t?._count?.neos);
    }
  };
  if (submitted) {
    return (
      <ProtectedRoute>
        <Layout variant="home">
          <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex-1 flex items-center justify-center py-8 md:py-12 lg:py-16 min-h-[70vh]">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md md:max-w-lg lg:max-w-xl"
              >
                <div className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] p-8 md:p-10 lg:p-12 border border-neutral-100 dark:border-neutral-800 shadow-soft text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-success-100 dark:bg-green-900/30 rounded-full md:rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 lg:mb-8">
                    <Check className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-success-600 dark:text-green-400" />
                  </div>
                  <h1 className="heading-2 text-neutral-950 dark:text-neutral-50 mb-2 md:mb-3 lg:mb-4">
                    Suggestion Submitted!
                  </h1>
                  <p className="body-base lg:body-large text-neutral-600 dark:text-neutral-400 mb-6 md:mb-8 lg:mb-10 max-w-md mx-auto">
                    Thank you for contributing to the Awalingo community. Your
                    suggestion will be reviewed and made available for voting
                    soon.
                  </p>
                  <div className="space-y-3 md:space-y-4">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={handleSubmitAnother}
                      className="h-12 md:h-14 lg:h-16 text-base md:text-lg font-medium rounded-2xl md:rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Submit Another
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      onClick={handleGoBack}
                      className="h-12 md:h-14 lg:h-16 text-base md:text-lg font-medium rounded-2xl md:rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {showModal && Modal(modalTitle, modalBody, () => setShowModal(false))}
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
              Curation Lounge
            </span>
            <div className="md:w-20">
              <MyCommunityTag
                userNeoCommunity={userNeoCommunity}
                user={appUser}
              />
            </div>{' '}
            {/* Spacer for centering */}
          </div>

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
              <div className="flex-1 pb-20 md:pb-8">
                {Object.keys(term).length > 0 ? (
                  <>
                    <WordOfTheDay
                      word={term?.text || 'Loading...'}
                      definition={
                        term?.concept?.gloss || 'No definition available.'
                      }
                      partOfSpeech={term?.partOfSpeech?.name || 'nouns'}
                      showWordOfTheDay={false}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Form */}
                      <form
                        onSubmit={() => setSubmitting(true)}
                        action={formData => {
                          formData.append('userId', appUser?.id || '');
                          formData.append('termId', term.id.toString());
                          formAction(formData);
                        }}
                        className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 lg:space-y-10"
                      >
                        {/* Two-column layout for larger screens */}
                        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 md:gap-8">
                          {suggestions.map((suggestion, index) => (
                            <React.Fragment key={index}>
                              <SuggestInput
                                key={index}
                                type={suggestion.type}
                                value={suggestion.text}
                                label={
                                  suggestion.type.charAt(0).toUpperCase() +
                                  suggestion.type.slice(1)
                                }
                                onChange={value => {
                                  suggestions[index].type = value;
                                  suggestions[index].description =
                                    getDescription(value);
                                  setSuggestions([...suggestions]);
                                }}
                                onInfoClick={() => {
                                  setModalTitle(
                                    <div className="flex items-center gap-2">
                                      {typeIcon(suggestion.type)}{' '}
                                      {suggestion.type.charAt(0).toUpperCase() +
                                        suggestion.type.slice(1)}
                                    </div>
                                  );
                                  setModalBody(
                                    <p className="">{suggestion.description}</p>
                                  );
                                  setShowModal(true);
                                }}
                                onInput={value => {
                                  suggestions[index].text = value;
                                  setSuggestions([...suggestions]);
                                }}
                                canDelete={index !== 0} // Prevent deletion of the first suggestion
                                onDelete={() => {
                                  suggestions.splice(index, 1);
                                  setSuggestions([...suggestions]);
                                }}
                                onAudioChange={url => {
                                  suggestions[index].audioUrl = url;
                                  setSuggestions([...suggestions]);
                                }}
                              />
                              <input
                                type="hidden"
                                name={`suggestions[${index}]`}
                                value={JSON.stringify(suggestion)}
                              />
                              <input
                                type="hidden"
                                name={`suggestions[${index}].type`}
                                value={suggestion.type}
                              />
                              <input
                                type="hidden"
                                name={`suggestions[${index}].text`}
                                value={suggestion.text}
                              />
                              <input
                                type="hidden"
                                name={`suggestions[${index}].audioUrl`}
                                value={suggestion.audioUrl || ''}
                              />
                              {suggestion.error && (
                                <span
                                  onClick={() =>
                                    setSuggestions(prev =>
                                      prev.map((s, i) =>
                                        i === index ? { ...s, error: null } : s
                                      )
                                    )
                                  }
                                  className="body-small text-red-600 dark:text-red-400"
                                >
                                  {suggestion.error} &nbsp;{' '}
                                  <em className="text-[#000000] dark:text-[#FFFFFF] cursor-pointer">
                                    Dismiss
                                  </em>
                                </span>
                              )}
                              <hr />
                            </React.Fragment>
                          ))}
                          <span
                            onClick={() => {
                              if (
                                Object.keys(term).length === 0 ||
                                suggestions.length === availableNeoSlots
                              )
                                return;
                              setSuggestions(prev => [
                                ...prev,
                                {
                                  type: '',
                                  description:
                                    'Please select a suggestion type and provide your suggestion for the word of the day.',
                                  text: '',
                                  audioUrl: '',
                                  error: null,
                                },
                              ]);
                            }}
                            className="justify-self-center text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer flex"
                          >
                            {' '}
                            <Plus className="ml-2 w-5 h-5 md:w-6 md:h-6" />{' '}
                            <span>Add more Suggestion for this word</span>
                          </span>
                        </div>

                        <div className="pt-4 md:pt-6">
                          <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={submitting}
                            disabled={
                              suggestions.filter(s => !s.text.trim()).length >
                                0 ||
                              suggestions.filter(s => !s.type).length > 0 ||
                              suggestions.length == 0
                            }
                            className="h-12 md:h-14 lg:h-16 rounded-full md:rounded-full font-medium text-base md:text-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            Submit
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  </>
                ) : (
                  <TermsList
                    title="More words to make suggestions for"
                    terms={terms}
                    onSelectTerm={setOneTerm}
                  />
                )}
                <div className="flex flex-row justify-center mt-6 md:mt-8 lg:mt-10">
                  <div className="flex  gap-1 flex-row justify-center">
                    <Button
                      variant="outline"
                      size="md"
                      className="rounded-full"
                      onClick={() => setLoadSuggestionsTrigger(true)}
                      disabled={true}
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
                      Curation Lounge{' '}
                      <ArrowLeft className="rotate-180 ml-2 w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </div>

          {/* Main Content */}
          <div className="lg:hidden  flex-1 pb-20 md:pb-8">
            {Object.keys(term).length > 0 ? (
              <>
                <WordOfTheDay
                  word={term?.text || 'Loading...'}
                  definition={
                    term?.concept?.gloss || 'No definition available.'
                  }
                  partOfSpeech={term?.partOfSpeech?.name || 'nouns'}
                  showWordOfTheDay={false}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Form */}
                  <form
                    onSubmit={() => setSubmitting(true)}
                    action={formData => {
                      formData.append('userId', appUser?.id || '');
                      formData.append('termId', term.id.toString());
                      formAction(formData);
                    }}
                    className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 lg:space-y-10"
                  >
                    {/* Two-column layout for larger screens */}
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 md:gap-8">
                      {suggestions.map((suggestion, index) => (
                        <React.Fragment key={index}>
                          <SuggestInput
                            key={index}
                            type={suggestion.type}
                            value={suggestion.text}
                            label={
                              suggestion.type.charAt(0).toUpperCase() +
                              suggestion.type.slice(1)
                            }
                            onChange={value => {
                              suggestions[index].type = value;
                              suggestions[index].description =
                                getDescription(value);
                              setSuggestions([...suggestions]);
                            }}
                            onInfoClick={() => {
                              setModalTitle(
                                <div className="flex items-center gap-2">
                                  {typeIcon(suggestion.type)}{' '}
                                  {suggestion.type.charAt(0).toUpperCase() +
                                    suggestion.type.slice(1)}
                                </div>
                              );
                              setModalBody(
                                <p className="">{suggestion.description}</p>
                              );
                              setShowModal(true);
                            }}
                            onInput={value => {
                              suggestions[index].text = value;
                              setSuggestions([...suggestions]);
                            }}
                            canDelete={index !== 0} // Prevent deletion of the first suggestion
                            onDelete={() => {
                              suggestions.splice(index, 1);
                              setSuggestions([...suggestions]);
                            }}
                            onAudioChange={url => {
                              suggestions[index].audioUrl = url;
                              setSuggestions([...suggestions]);
                            }}
                          />
                          <input
                            type="hidden"
                            name={`suggestions[${index}]`}
                            value={JSON.stringify(suggestion)}
                          />
                          <input
                            type="hidden"
                            name={`suggestions[${index}].type`}
                            value={suggestion.type}
                          />
                          <input
                            type="hidden"
                            name={`suggestions[${index}].text`}
                            value={suggestion.text}
                          />
                          <input
                            type="hidden"
                            name={`suggestions[${index}].audioUrl`}
                            value={suggestion.audioUrl || ''}
                          />
                          {suggestion.error && (
                            <span
                              onClick={() =>
                                setSuggestions(prev =>
                                  prev.map((s, i) =>
                                    i === index ? { ...s, error: null } : s
                                  )
                                )
                              }
                              className="body-small text-red-600 dark:text-red-400"
                            >
                              {suggestion.error} &nbsp;{' '}
                              <em className="text-[#000000] dark:text-[#FFFFFF] cursor-pointer">
                                Dismiss
                              </em>
                            </span>
                          )}
                          <hr />
                        </React.Fragment>
                      ))}
                      <span
                        onClick={() => {
                          if (suggestions.length === availableNeoSlots) return;
                          setSuggestions(prev => [
                            ...prev,
                            {
                              type: '',
                              description:
                                'Please select a suggestion type and provide your suggestion for the word of the day.',
                              text: '',
                              audioUrl: '',
                              error: null,
                            },
                          ]);
                        }}
                        className="justify-self-center text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer flex"
                      >
                        {' '}
                        <Plus className="ml-2 w-5 h-5 md:w-6 md:h-6" />{' '}
                        <span>Add more Suggestion for this word</span>
                      </span>
                    </div>

                    <div className="pt-4 md:pt-6">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={submitting}
                        disabled={
                          suggestions.filter(s => !s.text.trim()).length > 0 ||
                          suggestions.filter(s => !s.type).length > 0 ||
                          suggestions.length == 0
                        }
                        className="h-12 md:h-14 lg:h-16 rounded-full md:rounded-full font-medium text-base md:text-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Submit
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </>
            ) : (
              <TermsList
                title="More words to make suggestions for"
                terms={terms}
                onSelectTerm={setOneTerm}
              />
            )}
            <div className="flex flex-row justify-center mt-6 md:mt-8 lg:mt-10">
              <div className="flex  gap-1 flex-row justify-center">
                <Button
                  variant="outline"
                  size="md"
                  className="rounded-full"
                  onClick={() => setLoadSuggestionsTrigger(true)}
                  disabled={true}
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
                  Curation Lounge{' '}
                  <ArrowLeft className="rotate-180 ml-2 w-5 h-5 md:w-6 md:h-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
