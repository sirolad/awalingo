import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDomainList } from '@/components/admin/AdminDomainList';

export const metadata: Metadata = {
  title: 'Dictionary Domains | Admin | Awalingo',
  description: 'Manage dictionary domains and categories',
};

export default function AdminDomainsPage() {
  return (
    <AdminLayout
      title="Dictionary Domains"
      description="Manage the domains used to categorize words and concepts."
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminDomainList />
      </div>
    </AdminLayout>
  );
}
