'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';
import { AdminRequestList } from '@/components/admin/AdminRequestList';

export default function AdminRequestsPage() {
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
        title="All Word Requests"
        description="View all dictionary translation requests regardless of their current review status."
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
            <AdminRequestList />
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
