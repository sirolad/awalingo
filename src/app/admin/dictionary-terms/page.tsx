'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';
import { AdminTermList } from '@/components/admin/AdminTermList';

export default function AdminDictionaryTermsPage() {
  const { userRole, isLoading, appUser, userNeoCommunity, can } = useAuth();

  if (!isLoading && !can('view:admin') && userRole !== 'JUROR' && userRole !== 'ADMIN') {
    redirect('/home');
  }

  return (
    <ProtectedRoute>
      <Layout variant="fullbleed">
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950">
          {/* Header */}
          <div className="px-4 md:px-6 lg:px-8 w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between py-4 md:py-6 lg:py-8">
              <div className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center text-neutral-950 dark:text-neutral-50 hover:text-primary-800 dark:hover:text-primary-200 transition-colors p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                  <span className="body-small md:body-base font-medium hidden lg:block">
                    Dashboard
                  </span>
                </Link>
                <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 hidden md:block" />
                <span className="heading-4 text-neutral-950 dark:text-neutral-50">
                  Dictionary Terms
                </span>
              </div>
              <div className="flex items-center gap-4">
                <MyCommunityTag
                  userNeoCommunity={userNeoCommunity}
                  user={{
                    name: appUser?.name || null,
                    avatar: null,
                  }}
                />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-2">
              <p className="body-base text-neutral-500 dark:text-neutral-400">
                Manage, add, and edit dictionary terms across all supported languages.
              </p>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col px-4 md:px-6 lg:px-8 py-2 overflow-y-auto">
            <div className="w-full max-w-7xl mx-auto space-y-4">
              <AdminTermList />
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
