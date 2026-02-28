'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminTermData, deleteAdminTerm, getAdminTerms } from '@/actions/admin-terms';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Edit2, Trash2, Plus, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { TermDialog } from './TermDialog';

export function AdminTermList() {
  const [terms, setTerms] = useState<AdminTermData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 15;
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<AdminTermData | null>(null);

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    const result = await getAdminTerms({
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
    });
    
    if (result.success && result.terms) {
      setTerms(result.terms);
      setTotal(result.total || 0);
    } else {
      toast.error('Failed to load terms');
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const handleEdit = (term: AdminTermData) => {
    setSelectedTerm(term);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedTerm(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this term?')) return;
    
    const result = await deleteAdminTerm(id);
    if (result.success) {
      toast.success('Term deleted');
      fetchTerms();
    } else {
      toast.error(result.error || 'Failed to delete term');
    }
  };

  const handleModalClose = (refresh: boolean) => {
    setIsDialogOpen(false);
    setSelectedTerm(null);
    if (refresh) fetchTerms();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-96">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            onClear={() => {
              setSearch('');
              setPage(1);
            }}
            placeholder="Search by text or meaning..."
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
          Add Term
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400">Word</th>
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400">Language</th>
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400 hidden lg:table-cell">Meaning</th>
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400 hidden lg:table-cell">POS</th>
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400 hidden xl:table-cell">Domains</th>
                <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500 body-base">
                    Loading terms...
                  </td>
                </tr>
              ) : terms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500 body-base">
                    No terms found. Try adjusting your search query or add a new term.
                  </td>
                </tr>
              ) : (
                terms.map((term) => (
                  <tr key={term.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4 align-top max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-950 dark:text-neutral-50">{term.text}</span>
                        {term.phonics && (
                          <div className="flex items-center text-neutral-400 text-xs gap-1 opacity-60">
                            <Volume2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      {/* Mobile representation of hidden data */}
                      <div className="lg:hidden mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {term.meaning}
                      </div>
                    </td>
                    <td className="p-4 align-top whitespace-nowrap">
                      <span className="inline-flex py-1 px-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium">
                        {term.language.name}
                      </span>
                    </td>
                    <td className="p-4 align-top text-neutral-600 dark:text-neutral-300 hidden lg:table-cell max-w-[250px] truncate">
                      {term.meaning}
                    </td>
                    <td className="p-4 align-top hidden lg:table-cell whitespace-nowrap">
                      {term.partOfSpeech.name}
                    </td>
                    <td className="p-4 align-top hidden xl:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {term.domains.slice(0, 2).map((d) => (
                          <span key={d.domain.id} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            {d.domain.name}
                          </span>
                        ))}
                        {term.domains.length > 2 && (
                          <span className="text-[10px] text-neutral-500">+{term.domains.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(term)}
                          className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(term.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete"
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
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {isDialogOpen && (
        <TermDialog 
          isOpen={isDialogOpen} 
          onClose={handleModalClose} 
          termToEdit={selectedTerm} 
        />
      )}
    </div>
  );
}
