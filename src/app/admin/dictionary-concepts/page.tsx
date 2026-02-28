'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';
import { AdminConceptList } from '@/components/admin/AdminConceptList';

export default function AdminDictionaryConceptsPage() {
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
        title="Dictionary Concepts"
        description="Manage abstract concepts that group dictionary terms together."
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
            <AdminConceptList />
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
