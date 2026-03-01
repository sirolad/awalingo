'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { CtaCard } from '@/components/ui/WordCtaCard';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';
import { HomePageSkeleton } from '@/components/home/HomePageSkeleton';

interface WordCard {
  id: string;
  word: string;
  type: 'suggestion' | 'voting';
  bgColor: string;
  borderColor: string;
  tagColor: string;
}

export default function HomePage() {
  const { appUser, userRole, userNeoCommunity, isLoading, can } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const user = appUser;
  const router = useRouter();

  const wordCards: WordCard[] = [
    {
      id: '1',
      word: 'Hydrogen',
      type: 'suggestion',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      tagColor: 'bg-orange-100 text-orange-800',
    },
    {
      id: '2',
      word: 'Tripod',
      type: 'voting',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      tagColor: 'bg-blue-100 text-blue-800',
    },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleCta = (route: string) => {
    router.push(route);
  };

  return (
    <ProtectedRoute>
      <Layout variant="home">
        <div className="px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* User Greeting Header */}
            <div className="flex items-center justify-between py-4 md:py-6 lg:py-8 align-middle">
              <div className="flex items-center space-x-28 md:space-x-4">
                <div className="hidden lg:block">
                  <h1 className="heading-4 text-neutral-950 dark:text-neutral-50 hidden lg:block">
                    Hi {user?.name?.split(' ')[0] || 'User'}!
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-4 lg:hidden justify-between w-full">
                <div className="">
                  <span className="heading-5">
                    Hi, {user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <button className="px-1.5 py-0.5 body-xs rounded-[0.25rem] bg-[#9c62d9] border border-neutral-200 ml-2 text-neutral-50">
                    {userRole
                      ? userRole.charAt(0).toUpperCase() +
                        userRole.slice(1).toLowerCase()
                      : ''}
                  </button>
                </div>
                <MyCommunityTag
                  userNeoCommunity={userNeoCommunity}
                  user={user}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 pb-20 md:pb-8">
              {isLoading ? (
                <HomePageSkeleton />
              ) : (
                <>
                  {/* Desktop Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
                    {/* Left Column - Main Cards */}
                    <div className="space-y-6 md:space-y-8">
                      {/* Request Card */}
                      <CtaCard
                        title="Request a Neo"
                        subTitle="Got a word in your mind?"
                        word="Ask the community to mine Neos"
                        ctaText="Word on your mind"
                        variant="request"
                        onHandleClick={() => handleCta('/dictionary/request')}
                      />
                      {can('rate:neos') ? (
                        <CtaCard
                          title="Jury Dashboard"
                          subTitle="Review and manage word suggestions"
                          word="Your jury dashboard"
                          ctaText="Go to dashboard"
                          variant="jury"
                          onHandleClick={() => handleCta('/jury')}
                        />
                      ) : (
                        <CtaCard
                          title="Make Your Suggestion"
                          subTitle={`Suggest a ${userNeoCommunity?.name} word for the word of the day!`}
                          word={wordCards[0].word}
                          ctaText="Word of the day"
                          variant="suggest"
                          onHandleClick={() => handleCta('/suggest')}
                        />
                      )}
                      {/* Voting Card */}
                      <CtaCard
                        title="Vote for today's best word"
                        subTitle="Vote for the top ranked suggested words"
                        word={wordCards[1].word}
                        ctaText="Word of the day"
                        variant="vote"
                        onHandleClick={() => handleCta('/vote')}
                      />
                    </div>

                    {/* Right Column - Leaderboard (Desktop) or Third Card (Mobile) */}
                    <div className="lg:sticky lg:top-8 lg:h-fit space-y-6 md:space-y-8">
                      {/* Review Card - Visible to users with review permission */}
                      {can('review:requests') && (
                        <CtaCard
                          title="Review Requests"
                          subTitle="Approve or reject new requests"
                          word="Curate the dictionary"
                          ctaText="Pending Reviews"
                          variant="review"
                          onHandleClick={() => handleCta('/curator/requests')}
                        />
                      )}

                      {/* Leaderboard Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                        className="bg-white dark:bg-neutral-900 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {/* Card Header */}
                        <div className="p-6 md:p-8 lg:p-10">
                          <div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-8">
                            <h2 className="heading-4 text-neutral-950 dark:text-neutral-50">
                              Leaderboard
                            </h2>
                            <button
                              onClick={handleRefresh}
                              disabled={refreshing}
                              className="p-2 md:p-3 lg:p-4 rounded-full hover:bg-neutral-100 transition-colors active:scale-95"
                            >
                              <RefreshCcw
                                className={`w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-neutral-600 dark:text-neutral-400 ${refreshing ? 'animate-spin' : ''}`}
                              />
                            </button>
                          </div>

                          {/* Suggested Word Tag */}
                          <div className="inline-flex items-center gap-2 md:gap-3 lg:gap-4 px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-4 bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-colors">
                            <span className="body-small font-medium text-primary-800 dark:text-primary-200">
                              Suggested word
                            </span>
                            <RefreshCcw className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-primary-600 dark:text-primary-400" />
                          </div>

                          {/* Additional Desktop Content */}
                          <div className="hidden lg:block mt-8 space-y-6">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-4 rounded-2xl border border-orange-200 dark:border-orange-800">
                                <div className="heading-4 text-orange-600 dark:text-orange-400">
                                  24
                                </div>
                                <div className="body-small font-medium text-orange-800 dark:text-orange-300">
                                  Suggestions Today
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
                                <div className="heading-4 text-blue-600 dark:text-blue-400">
                                  156
                                </div>
                                <div className="body-small font-medium text-blue-800 dark:text-blue-300">
                                  Votes Cast
                                </div>
                              </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="space-y-3">
                              <h3 className="heading-5 text-neutral-950 dark:text-neutral-50">
                                Recent Activity
                              </h3>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="body-small text-neutral-700 dark:text-neutral-300">
                                    New word suggestion received
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="body-small text-neutral-700 dark:text-neutral-300">
                                    5 votes cast on &ldquo;Technology&rdquo;
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
