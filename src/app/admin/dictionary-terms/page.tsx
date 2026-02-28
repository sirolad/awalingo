'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';
import { AdminTermList } from '@/components/admin/AdminTermList';

export default function AdminDictionaryTermsPage() {
  const { userRole, isLoading, appUser, userNeoCommunity, can } = useAuth();

  if (
    !isLoading &&
    !can('view:admin') &&
    userRole !== 'JUROR' &&
    userRole !== 'ADMIN'
  ) {
    redirect('/home');
  }

  return (
    <ProtectedRoute>
      <AdminLayout
        title="Dictionary Terms"
        description="Manage, add, and edit dictionary terms across all supported languages."
        headerActions={
          <MyCommunityTag
            userNeoCommunity={userNeoCommunity}
            user={{
              name: appUser?.name || null,
              avatar: null,
            }}
          />
        }
      >
        <div className="flex-1 flex flex-col px-4 md:px-6 lg:px-8 py-6 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto space-y-4">
            <AdminTermList />
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
