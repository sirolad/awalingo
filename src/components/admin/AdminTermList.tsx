'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AdminTermData,
  deleteAdminTerm,
  getAdminTerms,
  bulkAddAdminTerms,
} from '@/actions/admin-terms';
import { getSourceLanguages } from '@/actions/catalog';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import {
  Edit2,
  Trash2,
  Plus,
  Volume2,
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { TermDialog } from './TermDialog';
import Papa from 'papaparse';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LanguageColumns } from '@/types';

export function AdminTermList() {
  const [activeTab, setActiveTab] = useState<'manage' | 'csv'>('manage');
  const [languages, setLanguages] = useState<LanguageColumns[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | ''>('');

  // Manage Tab State
  const [terms, setTerms] = useState<AdminTermData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // CSV Tab State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<AdminTermData | null>(null);

  const fetchLanguages = useCallback(async () => {
    const langs = await getSourceLanguages();
    if (langs && langs.length > 0) {
      setLanguages(langs as unknown as LanguageColumns[]);
      setSelectedLanguageId(langs[0].id);
    }
  }, []);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  const fetchTerms = useCallback(async () => {
    // Only fetch if manage tab is active and language is selected
    if (activeTab !== 'manage' || !selectedLanguageId) return;

    setLoading(true);
    const result = await getAdminTerms({
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
      languageId: Number(selectedLanguageId),
    });

    if (result.success && result.terms) {
      setTerms(result.terms);
      setTotal(result.total || 0);
    } else {
      toast.error('Failed to load terms');
    }
    setLoading(false);
  }, [page, search, selectedLanguageId, activeTab]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  // --- CSV Handling ---
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      setCsvSuccess(null);
      setCsvError(null);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !selectedLanguageId) return;
    setIsUploadingCsv(true);
    setCsvSuccess(null);
    setCsvError(null);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        try {
          const formattedTerms = [];
          for (const row of results.data as any[]) {
            const getVal = (key: string) => {
              const actualKey = Object.keys(row).find(
                k => k.trim().toLowerCase() === key.toLowerCase()
              );
              return actualKey ? row[actualKey] : '';
            };

            const text = getVal('word') || getVal('text');
            const meaning = getVal('meaning') || getVal('gloss');
            const partOfSpeech = getVal('part of speech') || getVal('pos');
            const phonics = getVal('phonics');
            const domainsRaw = getVal('domains');

            if (!text || !meaning || !partOfSpeech) {
              continue; // omit rows missing hard requirements
            }

            const domains = domainsRaw
              ? domainsRaw
                  .split(',')
                  .map((d: string) => d.trim())
                  .filter(Boolean)
              : [];

            formattedTerms.push({
              languageId: Number(selectedLanguageId),
              text,
              meaning,
              partOfSpeech,
              phonics,
              domains,
            });
          }

          if (formattedTerms.length === 0) {
            setCsvError(
              'No valid terms found in CSV. Required headers: Word, Meaning, Part of Speech.'
            );
            setIsUploadingCsv(false);
            return;
          }

          const result = await bulkAddAdminTerms(formattedTerms);

          if (result.success) {
            setCsvSuccess(`Successfully added ${result.count} terms!`);
            if (result.errors && result.errors.length > 0) {
              // Show partial errors if some failed (e.g duplicates)
              setCsvError(
                `Completed with some errors:\n${result.errors.join('\n')}`
              );
            }
            setCsvFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
            setCsvError(result.error || 'Failed to upload terms');
          }
        } catch (_err) {
          setCsvError('Error parsing or submitting CSV file.');
        } finally {
          setIsUploadingCsv(false);
        }
      },
      error: error => {
        setCsvError('Error parsing CSV file: ' + error.message);
        setIsUploadingCsv(false);
      },
    });
  };

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
      {/* Global Settings */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-8 mt-4">
        <label className="block heading-6 text-neutral-900 dark:text-neutral-100 mb-3">
          Language
        </label>
        <Select
          value={String(selectedLanguageId)}
          onValueChange={val => {
            setSelectedLanguageId(Number(val));
            setPage(1);
          }}
          disabled={languages.length === 0}
        >
          <SelectTrigger className="w-full md:w-1/2">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map(lang => (
              <SelectItem key={lang.id} value={String(lang.id)}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-6 w-full overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('manage')}
          className={`pb-4 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'manage' ? 'text-primary' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          Manage Existing
          {activeTab === 'manage' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'csv' ? 'text-primary' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          CSV Upload
          {activeTab === 'csv' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === 'manage' && (
        <>
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
              disabled={!selectedLanguageId}
            >
              Add Term
            </Button>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                    <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400">
                      Word
                    </th>
                    <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400">
                      Language
                    </th>
                    <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400 hidden lg:table-cell">
                      Meaning
                    </th>
                    <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400 hidden lg:table-cell">
                      POS
                    </th>
                    <th className="p-4 body-small font-medium text-neutral-500 dark:text-neutral-400 hidden xl:table-cell">
                      Domains
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
                        colSpan={6}
                        className="p-8 text-center text-neutral-500 body-base"
                      >
                        Loading terms...
                      </td>
                    </tr>
                  ) : terms.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-neutral-500 body-base"
                      >
                        No terms found. Try adjusting your search query or add a
                        new term.
                      </td>
                    </tr>
                  ) : (
                    terms.map(term => (
                      <tr
                        key={term.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="p-4 align-top max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-950 dark:text-neutral-50">
                              {term.text}
                            </span>
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
                            {term.domains.slice(0, 2).map(d => (
                              <span
                                key={d.domain.id}
                                className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded"
                              >
                                {d.domain.name}
                              </span>
                            ))}
                            {term.domains.length > 2 && (
                              <span className="text-[10px] text-neutral-500">
                                +{term.domains.length - 2}
                              </span>
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
          {activeTab === 'manage' && !loading && total > pageSize && (
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
        </>
      )}

      {/* CSV Upload */}
      {activeTab === 'csv' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl body-small">
              <p className="font-semibold mb-2">CSV Format Requirements:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your file must have a header row.</li>
                <li>
                  Required columns:{' '}
                  <strong>Word/Text, Meaning/Gloss, Part of Speech/POS</strong>
                </li>
                <li>
                  Optional columns: <strong>Phonics, Domains</strong>
                </li>
                <li>
                  Domains should be separated by commas (e.g.,{' '}
                  <em>"Science, Medicine"</em>).
                </li>
                <li>
                  Words will be assigned to the <strong>Language</strong>{' '}
                  selected above.
                </li>
                <li>
                  Concept groupings will be generated automatically based on
                  matching Meaning text.
                </li>
              </ul>
            </div>

            {csvSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>{csvSuccess}</p>
              </div>
            )}
            {csvError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-semibold">Import Issue</p>
                </div>
                <pre className="text-xs whitespace-pre-wrap ml-8">
                  {csvError}
                </pre>
              </div>
            )}

            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-4" />
              <h3 className="heading-6 text-neutral-900 dark:text-neutral-100 mb-2">
                Upload CSV File
              </h3>
              <p className="text-sm text-neutral-500 mb-6">
                Drag and drop your file here, or click to browse
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={handleCsvChange}
                className="hidden"
                id="csv-upload"
                ref={fileInputRef}
              />
              <Button asChild variant="outline" disabled={!selectedLanguageId}>
                <label
                  htmlFor="csv-upload"
                  className={
                    !selectedLanguageId
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                  }
                >
                  Browse Files
                </label>
              </Button>

              {csvFile && (
                <p className="mt-4 text-sm font-medium text-primary">
                  Selected: {csvFile.name}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
              <Button
                onClick={handleCsvUpload}
                disabled={!csvFile || isUploadingCsv || !selectedLanguageId}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploadingCsv ? 'Uploading...' : 'Upload Terms'}
              </Button>
            </div>
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
