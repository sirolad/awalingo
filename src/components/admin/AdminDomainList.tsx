'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AdminDomainData,
  getAdminDomains,
  deleteAdminDomain,
} from '@/actions/admin-domains';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Edit2, Trash2, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DomainDialog } from './DomainDialog';

export function AdminDomainList() {
  const [domains, setDomains] = useState<AdminDomainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<AdminDomainData | null>(
    null
  );

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    const result = await getAdminDomains({
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
    });

    if (result.success && result.domains) {
      setDomains(result.domains);
      setTotal(result.total || 0);
    } else {
      toast.error('Failed to load domains');
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleEdit = (domain: AdminDomainData) => {
    setSelectedDomain(domain);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedDomain(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (domain: AdminDomainData) => {
    if (domain._count.terms > 0 || domain._count.requests > 0) {
      toast.error(
        `Cannot delete: Domain is used in ${domain._count.terms} term(s) and ${domain._count.requests} request(s).`
      );
      return;
    }

    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      const result = await deleteAdminDomain(domain.id);
      if (result.success) {
        toast.success('Domain deleted successfully');
        fetchDomains(); // Refresh list
      } else {
        toast.error(result.error || 'Failed to delete domain');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-96">
          <SearchBar
            value={search}
            onChange={val => {
              setSearch(val);
              setPage(1); // Reset to first page on new search
            }}
            placeholder="Search domains..."
            className="w-full"
          />
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Domain
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                <th className="p-4 font-medium text-sm text-neutral-500 dark:text-neutral-400">
                  Name
                </th>
                <th className="p-4 font-medium text-sm text-neutral-500 dark:text-neutral-400">
                  Usage
                </th>
                <th className="p-4 font-medium text-sm text-neutral-500 dark:text-neutral-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-8 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      Loading domains...
                    </div>
                  </td>
                </tr>
              ) : domains.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-8 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-neutral-400 dark:text-neutral-600" />
                      No domains found.
                    </div>
                  </td>
                </tr>
              ) : (
                domains.map(domain => (
                  <tr
                    key={domain.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="p-4 align-middle font-medium text-neutral-900 dark:text-neutral-100">
                      {domain.name}
                    </td>
                    <td className="p-4 align-middle text-sm text-neutral-600 dark:text-neutral-300">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                        {domain._count.terms} terms
                      </span>
                      <span className="inline-flex items-center gap-2 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md ml-2">
                        {domain._count.requests} requests
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(domain)}
                          className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(domain)}
                          className={`text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 ${domain._count.terms > 0 || domain._count.requests > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, total)} of {total} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <DomainDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        domainToEdit={selectedDomain}
        onSuccess={() => {
          fetchDomains();
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
