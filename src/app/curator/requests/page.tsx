'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { RequestReviewList } from '@/components/review/RequestReviewList';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';

export default function RequestsReviewPage() {
  const { userRole, isLoading, appUser, userNeoCommunity } = useAuth();

  if (!isLoading && userRole !== 'ADMIN' && userRole !== 'JUROR') {
    redirect('/home');
  }

  return (
    <ProtectedRoute>
      <Layout variant="fullbleed">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 md:px-6 lg:px-8 w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between py-4 md:py-6 lg:py-8">
              <Link
                href="/home"
                className="inline-flex items-center text-neutral-950 dark:text-neutral-50 hover:text-primary-800 dark:hover:text-primary-200 transition-colors p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                <span className="body-small md:body-base font-medium hidden lg:block">
                  Back
                </span>
              </Link>
              <span className="heading-4 text-neutral-950 dark:text-neutral-50">
                Review Requests
              </span>
              <div className="">
                <MyCommunityTag
                  userNeoCommunity={userNeoCommunity}
                  user={{
                    name: appUser?.name || null,
                    avatar: null, // Avatar not available in appUser context currently
                  }}
                />
              </div>
            </div>
            <p className="body-base text-neutral-500 dark:text-neutral-400 mb-8 px-2 text-center md:text-left">
              Review and curate new translation requests from the community.
            </p>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col px-4 md:px-6 lg:px-8 py-2">
            <div className="w-full max-w-4xl mx-auto space-y-4">
              <RequestReviewList />
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
