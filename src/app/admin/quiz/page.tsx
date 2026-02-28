'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft,
  Upload,
  Plus,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  X,
  Search,
  MoreVertical,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import {
  addQuizQuestion,
  bulkAddQuizQuestions,
  getAdminQuizQuestions,
  updateQuizQuestion,
  deleteQuizQuestion,
  QuizOption,
} from '@/actions/quiz';
import { getTargetLanguages } from '@/actions/language';
import { LanguageColumns } from '@/types';

export default function AdminQuizPage() {
  const router = useRouter();
  const { appUser, isLoading: authLoading, userNeoCommunity } = useAuth();
  const { can } = usePermissions();

  const [activeTab, setActiveTab] = useState<'manage' | 'manual' | 'csv'>(
    'manage'
  );
  const [languages, setLanguages] = useState<LanguageColumns[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | ''>('');

  // Manual Form State
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualOptions, setManualOptions] = useState<QuizOption[]>([
    { label: 'A', value: '' },
    { label: 'B', value: '' },
    { label: 'C', value: '' },
    { label: 'D', value: '' },
  ]);
  const [manualCorrectAnswer, setManualCorrectAnswer] = useState<string>('A');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  // CSV State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Manage Tab State
  const [existingQuestions, setExistingQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null
  );
  const [editContent, setEditContent] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Existing Questions
  useEffect(() => {
    if (activeTab === 'manage' && selectedLanguageId) {
      const fetchQuestions = async () => {
        setIsLoadingQuestions(true);
        const res = await getAdminQuizQuestions(
          Number(selectedLanguageId),
          currentPage,
          20,
          debouncedSearch
        );
        if (res.success && res.questions) {
          setExistingQuestions(res.questions);
          setTotalPages(res.pagination?.totalPages || 1);
        }
        setIsLoadingQuestions(false);
      };
      fetchQuestions();
    }
  }, [activeTab, selectedLanguageId, currentPage, debouncedSearch]);

  const handleEditClick = (q: any) => {
    setEditingQuestionId(q.id);
    setEditContent({ ...q });
  };

  const handleEditSave = async (id: number) => {
    setIsSubmittingManual(true);
    const res = await updateQuizQuestion(id, {
      text: editContent.text,
      options: editContent.options,
      correctAnswer: editContent.correctAnswer,
      isActive: editContent.isActive,
    });
    setIsSubmittingManual(false);

    if (res.success && res.question) {
      setExistingQuestions(prev =>
        prev.map(q => (q.id === id ? res.question : q))
      );
      setEditingQuestionId(null);
    } else {
      alert('Failed to update question');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const res = await deleteQuizQuestion(id);
    if (res.success) {
      setExistingQuestions(prev => prev.filter(q => q.id !== id));
    } else {
      alert('Failed to delete question');
    }
  };

  const fetchLanguages = useCallback(async () => {
    const result = await getTargetLanguages();
    if (result.success && result.data.length > 0) {
      setLanguages(result.data);
      setSelectedLanguageId(result.data[0].id);
    }
  }, []);

  // Check permissions separately to avoid re-running when can function changes
  const hasAdminAccess = can('view:admin');

  useEffect(() => {
    if (authLoading) return;
    if (!appUser || !hasAdminAccess) {
      router.push('/home');
      return;
    }

    // Only fetch languages if they haven't been loaded yet
    if (languages.length === 0) {
      fetchLanguages();
    }
  }, [
    appUser,
    authLoading,
    hasAdminAccess,
    fetchLanguages,
    router,
    languages.length,
  ]);

  if (authLoading || !appUser) return null;

  // --- Manual Submission ---
  const handleManualOptionChange = (index: number, value: string) => {
    const newOptions = [...manualOptions];
    newOptions[index].value = value;
    setManualOptions(newOptions);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    setManualSuccess(null);
    setManualError(null);

    // Find the correct answer text to store
    const correctOption = manualOptions.find(
      o => o.label === manualCorrectAnswer
    );
    if (!correctOption || !correctOption.value.trim()) {
      setManualError('The selected correct answer option cannot be empty.');
      setIsSubmittingManual(false);
      return;
    }

    try {
      const result = await addQuizQuestion({
        languageId: Number(selectedLanguageId),
        text: manualQuestion,
        options: manualOptions,
        correctAnswer: correctOption.value.trim(),
      });

      if (result.success) {
        setManualSuccess('Question added successfully!');
        setManualQuestion('');
        setManualOptions([
          { label: 'A', value: '' },
          { label: 'B', value: '' },
          { label: 'C', value: '' },
          { label: 'D', value: '' },
        ]);
        setManualCorrectAnswer('A');
      } else {
        setManualError(result.error || 'Failed to add question');
      }
    } catch (err) {
      setManualError('An unexpected error occurred.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // --- CSV Submission ---
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      setCsvSuccess(null);
      setCsvError(null);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setIsUploadingCsv(true);
    setCsvSuccess(null);
    setCsvError(null);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        try {
          const formattedQuestions = [];
          for (const row of results.data as any[]) {
            // Expected headers conceptually: Question, Option A, Option B, Option C, Option D, Answer
            // We use keys derived from user input or just index mapping if standardizing

            // Map keys case-insensitively
            const getVal = (key: string) => {
              const actualKey = Object.keys(row).find(
                k => k.trim().toLowerCase() === key.toLowerCase()
              );
              return actualKey ? row[actualKey] : '';
            };

            const text =
              getVal('question') || getVal('text') || getVal('hausa'); // Attempting to handle the user's specific HAUSA column too just in case
            const optA = getVal('option a');
            const optB = getVal('option b');
            const optC = getVal('option c');
            const optD = getVal('option d');
            const ansLetterGroup = getVal('answer'); // "A", "B", "C", "D"

            if (!text || !optA || !optB || !optC || !optD || !ansLetterGroup) {
              // Skip invalid rows, maybe log them
              continue;
            }

            const options = [
              { label: 'A', value: optA },
              { label: 'B', value: optB },
              { label: 'C', value: optC },
              { label: 'D', value: optD },
            ];

            const ansLetter = ansLetterGroup.trim().toUpperCase() || 'A';
            const correctOption = options.find(o => o.label === ansLetter);
            const correctAnswer = correctOption ? correctOption.value : optA; // Fallback

            formattedQuestions.push({
              languageId: Number(selectedLanguageId),
              text: text,
              options: options,
              correctAnswer: correctAnswer,
            });
          }

          if (formattedQuestions.length === 0) {
            setCsvError(
              'No valid questions found in the CSV. Please check the format.'
            );
            setIsUploadingCsv(false);
            return;
          }

          const result = await bulkAddQuizQuestions(formattedQuestions);
          if (result.success) {
            setCsvSuccess(`Successfully added ${result.count} questions!`);
            setCsvFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
            setCsvError(result.error || 'Failed to upload questions');
          }
        } catch (err) {
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
                  Quiz Settings
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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 px-2">
              <p className="body-base text-neutral-500 dark:text-neutral-400">
                Manage the questions used for the Curator evaluation test.
                Select the language and choose to add questions manually or via
                CSV upload.
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col px-4 md:px-6 lg:px-8 py-2 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">
              {/* Global Settings */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-8">
                <label className="block heading-6 text-neutral-900 dark:text-neutral-100 mb-3">
                  Target Language
                </label>
                <Select
                  value={String(selectedLanguageId)}
                  onValueChange={val => {
                    setSelectedLanguageId(Number(val));
                    setCurrentPage(1);
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
                  onClick={() => setActiveTab('manual')}
                  className={`pb-4 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'manual' ? 'text-primary' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                >
                  Add Manually
                  {activeTab === 'manual' && (
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

              {/* Manage Form */}
              {activeTab === 'manage' && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
                  <div className="mb-6 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input
                      placeholder="Search questions by text..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {isLoadingQuestions ? (
                    <div className="flex items-center justify-center p-8">
                      <p className="text-neutral-500">Loading questions...</p>
                    </div>
                  ) : existingQuestions.length === 0 ? (
                    <div className="text-center p-8">
                      <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                        No questions found for this language.
                      </p>
                      <Button onClick={() => setActiveTab('manual')}>
                        Add First Question
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {existingQuestions.map(q => (
                        <div
                          key={q.id}
                          className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4"
                        >
                          {editingQuestionId === q.id ? (
                            <div className="space-y-4">
                              <Input
                                value={editContent.text}
                                onChange={e =>
                                  setEditContent({
                                    ...editContent,
                                    text: e.target.value,
                                  })
                                }
                                placeholder="Question text"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                {editContent.options.map(
                                  (opt: any, idx: number) => (
                                    <Input
                                      key={idx}
                                      value={opt.value}
                                      onChange={e => {
                                        const newOpts = [
                                          ...editContent.options,
                                        ];
                                        newOpts[idx].value = e.target.value;
                                        setEditContent({
                                          ...editContent,
                                          options: newOpts,
                                        });
                                      }}
                                      placeholder={`Option ${opt.label}`}
                                    />
                                  )
                                )}
                              </div>
                              <div className="flex gap-4 items-center">
                                <Select
                                  value={editContent.correctAnswer}
                                  onValueChange={val =>
                                    setEditContent({
                                      ...editContent,
                                      correctAnswer: val,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-[200px] h-9 text-sm">
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {editContent.options.map((opt: any) => (
                                      <SelectItem
                                        key={opt.label}
                                        value={opt.value}
                                      >
                                        {opt.label} ({opt.value})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <label className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100">
                                  <input
                                    type="checkbox"
                                    checked={editContent.isActive}
                                    onChange={e =>
                                      setEditContent({
                                        ...editContent,
                                        isActive: e.target.checked,
                                      })
                                    }
                                    className="rounded border-neutral-300"
                                  />
                                  Active
                                </label>
                              </div>
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingQuestionId(null)}
                                >
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleEditSave(q.id)}
                                  disabled={isSubmittingManual}
                                >
                                  <Save className="w-4 h-4 mr-1" /> Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                  {q.text}
                                </h3>
                                <div className="flex gap-1 shrink-0 ml-4">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleEditClick(q)}
                                        className="text-blue-600 dark:text-blue-400"
                                      >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDelete(q.id)}
                                        className="text-red-600 dark:text-red-400"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                                {q.options.map((opt: any) => (
                                  <div
                                    key={opt.label}
                                    className={`p-2 rounded ${q.correctAnswer === opt.value ? 'bg-green-50 dark:bg-green-900/20 text-green-700 border border-green-200 dark:border-green-800' : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'}`}
                                  >
                                    <span className="font-semibold mr-2">
                                      {opt.label}:
                                    </span>
                                    {opt.value}
                                  </div>
                                ))}
                              </div>
                              {!q.isActive && (
                                <div className="mt-3 inline-block px-2 text-xs py-1 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-600 font-medium">
                                  Inactive / Draft
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage(prev => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1 || isLoadingQuestions}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage(prev =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            disabled={
                              currentPage === totalPages || isLoadingQuestions
                            }
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Form */}
              {activeTab === 'manual' && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
                  <form onSubmit={handleManualSubmit} className="space-y-6">
                    {manualSuccess && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <p>{manualSuccess}</p>
                      </div>
                    )}
                    {manualError && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{manualError}</p>
                      </div>
                    )}

                    <div>
                      <label className="block body-small font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Question Text
                      </label>
                      <Input
                        required
                        placeholder="e.g., What is the Yoruba word for water?"
                        type="text"
                        value={manualQuestion}
                        onChange={e => setManualQuestion(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {manualOptions.map((opt, idx) => (
                        <div key={opt.label}>
                          <label className="block body-small font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                            Option {opt.label}
                          </label>
                          <Input
                            required
                            placeholder={`Detail for option ${opt.label}`}
                            type="text"
                            value={opt.value}
                            onChange={e =>
                              handleManualOptionChange(idx, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block body-small font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Correct Answer
                      </label>
                      <Select
                        value={manualCorrectAnswer}
                        onValueChange={setManualCorrectAnswer}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Option A</SelectItem>
                          <SelectItem value="B">Option B</SelectItem>
                          <SelectItem value="C">Option C</SelectItem>
                          <SelectItem value="D">Option D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      <Button
                        type="submit"
                        disabled={isSubmittingManual}
                        className="w-full sm:w-auto flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {isSubmittingManual ? 'Saving...' : 'Save Question'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* CSV Upload */}
              {activeTab === 'csv' && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl body-small">
                      <p className="font-semibold mb-2">
                        CSV Format Requirements:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Your file must have a header row.</li>
                        <li>
                          Required columns:{' '}
                          <strong>
                            Question, Option A, Option B, Option C, Option D,
                            Answer
                          </strong>
                        </li>
                        <li>
                          The <strong>Answer</strong> column should contain the
                          letter of the correct option (e.g., A, B, C, or D).
                        </li>
                        <li>
                          Questions will be assigned to the target language
                          selected above.
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
                      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{csvError}</p>
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
                      <Button asChild variant="outline">
                        <label htmlFor="csv-upload" className="cursor-pointer">
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
                        disabled={!csvFile || isUploadingCsv}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploadingCsv ? 'Uploading...' : 'Upload Questions'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
