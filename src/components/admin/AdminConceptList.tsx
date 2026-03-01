'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AdminConceptData,
  deleteAdminConcept,
  getAdminConcepts,
} from '@/actions/admin-concepts';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ConceptDialog } from './ConceptDialog';
import { formatDistanceToNow } from 'date-fns';

export function AdminConceptList() {
  const [concepts, setConcepts] = useState<AdminConceptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] =
    useState<AdminConceptData | null>(null);

  const fetchConcepts = useCallback(async () => {
    setLoading(true);
    const result = await getAdminConcepts({
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
    });

    if (result.success && result.concepts) {
      setConcepts(result.concepts);
      setTotal(result.total || 0);
    } else {
      toast.error('Failed to load concepts');
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  const handleEdit = (concept: AdminConceptData) => {
    setSelectedConcept(concept);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedConcept(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (concept: AdminConceptData) => {
    if (concept._count.terms > 0) {
      toast.error(
        `Cannot delete this concept because it has ${concept._count.terms} term(s) attached.`
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete the concept "${concept.gloss}"?`
      )
    )
      return;

    const result = await deleteAdminConcept(concept.id);
    if (result.success) {
      toast.success('Concept deleted');
      fetchConcepts();
    } else {
      toast.error(result.error || 'Failed to delete concept');
    }
  };

  const handleModalClose = (refresh: boolean) => {
    setIsDialogOpen(false);
    setSelectedConcept(null);
    if (refresh) fetchConcepts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-96">
          <SearchBar
            value={search}
            onChange={val => {
              setSearch(val);
              setPage(1);
            }}
            onClear={() => {
              setSearch('');
              setPage(1);
            }}
            placeholder="Search by gloss..."
            iconPosition="left"
            rounded={true}
          />
        </div>

        <Button
          variant="primary"
          onClick={handleAdd}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full md:w-auto shrink-0"
        >
          Add Concept
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400 w-16">
                  ID
                </th>
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400">
                  Gloss
                </th>
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400">
                  Terms Attached
                </th>
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">
                  Created At
                </th>
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-neutral-500 body-base"
                  >
                    Loading concepts...
                  </td>
                </tr>
              ) : concepts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-neutral-500 body-base"
                  >
                    No concepts found. Try adjusting your search query or add a
                    new concept.
                  </td>
                </tr>
              ) : (
                concepts.map(concept => (
                  <tr
                    key={concept.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="p-4 align-top text-neutral-500 font-mono text-sm">
                      #{concept.id}
                    </td>
                    <td className="p-4 align-top">
                      <span className="font-medium text-neutral-950 dark:text-neutral-50">
                        {concept.gloss}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <span
                        className={`inline-flex py-1 px-2.5 rounded-full text-xs font-medium ${concept._count.terms > 0 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}
                      >
                        {concept._count.terms}{' '}
                        {concept._count.terms === 1 ? 'term' : 'terms'}
                      </span>
                    </td>
                    <td className="p-4 align-top text-neutral-600 dark:text-neutral-400 hidden sm:table-cell text-sm">
                      {formatDistanceToNow(new Date(concept.createdAt), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="p-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(concept)}
                          className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(concept)}
                          className={`p-1.5 rounded-lg transition-colors ${concept._count.terms > 0 ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed' : 'text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                          title={
                            concept._count.terms > 0
                              ? 'Cannot delete (terms attached)'
                              : 'Delete'
                          }
                          disabled={concept._count.terms > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!loading && total > pageSize && (
        <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <p className="body-small text-neutral-500">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, total)} of {total} entries
          </p>
          <div className="flex gap-2">
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
              onClick={() => setPage(p => p + 1)}
              disabled={page * pageSize >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {isDialogOpen && (
        <ConceptDialog
          isOpen={isDialogOpen}
          onClose={handleModalClose}
          conceptToEdit={selectedConcept}
        />
      )}
    </div>
  );
}
