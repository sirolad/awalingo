'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AdminTermData,
  createAdminTerm,
  updateAdminTerm,
} from '@/actions/admin-terms';
import { getAdminConcepts } from '@/actions/admin-concepts';
import {
  getSourceLanguages,
  getPartsOfSpeech,
  getAllDomains,
} from '@/actions/catalog';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plus, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const termSchema = z.object({
  text: z.string().min(1, 'Word text is required').max(100),
  meaning: z.string().min(1, 'Meaning is required'),
  conceptId: z.number().nullable().optional(),
  phonics: z.string().optional(),
  languageId: z.number().positive('Language is required'),
  partOfSpeechId: z.number().positive('Part of Speech is required'),
  domains: z.array(z.string()).optional(),
});

type TermFormValues = z.infer<typeof termSchema>;

interface TermDialogProps {
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
  termToEdit: AdminTermData | null;
}

export function TermDialog({ isOpen, onClose, termToEdit }: TermDialogProps) {
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<{ id: number; name: string }[]>(
    []
  );
  const [partsOfSpeech, setPartsOfSpeech] = useState<
    { id: number; name: string }[]
  >([]);
  const [availableDomains, setAvailableDomains] = useState<
    { id: number; name: string }[]
  >([]);

  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [domainSuggestions, setDomainSuggestions] = useState<
    { id: number; name: string }[]
  >([]);

  const isEditing = !!termToEdit;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      text: '',
      meaning: '',
      conceptId: null,
      phonics: '',
      languageId: 0,
      partOfSpeechId: 0,
      domains: [],
    },
  });

  useEffect(() => {
    Promise.all([
      getSourceLanguages(),
      getPartsOfSpeech(),
      getAllDomains(),
    ]).then(([langs, pos, doms]) => {
      setLanguages(langs);
      setPartsOfSpeech(pos);
      setAvailableDomains(doms);
    });
  }, []);

  useEffect(() => {
    if (termToEdit && isOpen) {
      const existingDomains = termToEdit.domains.map(d => d.domain.name);
      setDomains(existingDomains);
      reset({
        text: termToEdit.text,
        meaning: termToEdit.meaning,
        conceptId: termToEdit.conceptId,
        phonics: termToEdit.phonics || '',
        languageId: termToEdit.language.id,
        partOfSpeechId: termToEdit.partOfSpeech.id,
        domains: existingDomains,
      });
      setDomainInput('');
      setDomainSuggestions([]);
    } else if (!termToEdit && isOpen) {
      setDomains([]);
      reset({
        text: '',
        meaning: '',
        conceptId: null,
        phonics: '',
        languageId: 0,
        partOfSpeechId: 0,
        domains: [],
      });
      setDomainInput('');
      setDomainSuggestions([]);
    }
  }, [termToEdit, isOpen, reset]);

  const [conceptResults, setConceptResults] = useState<
    { id: number; gloss: string }[]
  >([]);
  const [isSearchingConcepts, setIsSearchingConcepts] = useState(false);
  const [showConceptDropdown, setShowConceptDropdown] = useState(false);

  const meaningValue = watch('meaning');
  const conceptIdValue = watch('conceptId');
  const [conceptSearch, setConceptSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (conceptSearch.length > 2) {
        setIsSearchingConcepts(true);
        getAdminConcepts({ search: conceptSearch, take: 5 }).then(res => {
          if (res.success && res.concepts) {
            setConceptResults(
              res.concepts.map(c => ({ id: c.id, gloss: c.gloss }))
            );
            setShowConceptDropdown(true);
          }
          setIsSearchingConcepts(false);
        });
      } else {
        setConceptResults([]);
        setShowConceptDropdown(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [conceptSearch]);

  const [selectedConceptGloss, setSelectedConceptGloss] = useState<
    string | null
  >(null);

  // If we open an existing term, pre-populate its concept representation
  useEffect(() => {
    if (termToEdit?.conceptId && termToEdit?.concept) {
      setSelectedConceptGloss(termToEdit.concept.gloss);
    }
  }, [termToEdit]);

  // Filter domains based on input
  useEffect(() => {
    if (domainInput.trim().length > 0) {
      const filtered = availableDomains.filter(
        d =>
          d.name.toLowerCase().includes(domainInput.toLowerCase()) &&
          !domains.includes(d.name)
      );
      setDomainSuggestions(filtered);
    } else {
      setDomainSuggestions([]);
    }
  }, [domainInput, availableDomains, domains]);

  const handleAddDomain = (domainToAdd?: string) => {
    const value = domainToAdd || domainInput.trim();
    if (value && !domains.includes(value)) {
      const newDomains = [...domains, value];
      setDomains(newDomains);
      setValue('domains', newDomains);
      setDomainInput('');
      setDomainSuggestions([]);
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    const newDomains = domains.filter(d => d !== domainToRemove);
    setDomains(newDomains);
    setValue('domains', newDomains);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDomain();
    }
  };

  const onSubmit = async (data: TermFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', data.text);
      formData.append('meaning', data.meaning);
      if (data.conceptId)
        formData.append('conceptId', data.conceptId.toString());
      if (data.phonics) formData.append('phonics', data.phonics);
      formData.append('languageId', data.languageId.toString());
      formData.append('partOfSpeechId', data.partOfSpeechId.toString());

      formData.append('domains', JSON.stringify(data.domains || []));

      let result;
      if (isEditing) {
        result = await updateAdminTerm(termToEdit.id, formData);
      } else {
        result = await createAdminTerm(formData);
      }

      if (result.success) {
        toast.success(`Term ${isEditing ? 'updated' : 'created'} successfully`);
        onClose(true);
      } else {
        // Handle field errors if any
        if (typeof result.error === 'object' && result.error !== null) {
          const firstError = Object.values(result.error)[0] as string[];
          toast.error(firstError?.[0] || 'Validation failed');
        } else {
          toast.error((result.error as string) || 'Failed to save term');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formBody = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      <div className="space-y-1">
        <label className="body-small font-medium text-neutral-900 dark:text-neutral-100">
          Word Text
        </label>
        <input
          type="text"
          placeholder="e.g. Alafia"
          className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${errors.text ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}`}
          {...register('text')}
        />
        {errors.text && (
          <p className="body-xs text-red-500">{errors.text.message}</p>
        )}
      </div>

      <div className="space-y-1 relative">
        <label className="body-small font-medium text-neutral-900 dark:text-neutral-100">
          Meaning
        </label>
        <div className="relative">
          <textarea
            rows={3}
            placeholder="e.g. A state of tranquility"
            className={`w-full py-3 px-4 rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none ${errors.meaning ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}`}
            {...register('meaning')}
          />
        </div>
      </div>

      <div className="space-y-1 relative">
        <label className="body-small font-medium text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
          <span>Concept (Optional)</span>
          {conceptIdValue && (
            <button
              type="button"
              className="text-xs text-neutral-500 hover:text-red-500 hover:underline"
              onClick={() => {
                setValue('conceptId', null);
                setSelectedConceptGloss(null);
                setConceptSearch('');
              }}
            >
              (Clear Concept)
            </button>
          )}
        </label>

        {conceptIdValue ? (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 mt-0.5" />
            <div>
              <p className="body-small font-semibold text-green-800 dark:text-green-300">
                Linked to Concept #{conceptIdValue}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                {selectedConceptGloss}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="Search existing concepts..."
              className="w-full h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              value={conceptSearch}
              onChange={e => setConceptSearch(e.target.value)}
              autoComplete="off"
            />
            {isSearchingConcepts && (
              <div className="absolute right-3 top-3.5 w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            )}

            {/* Dropdown for Concepts */}
            {showConceptDropdown && conceptResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {conceptResults.map(concept => (
                  <div
                    key={concept.id}
                    className="px-4 py-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm flex items-center justify-between"
                    onClick={() => {
                      setValue('conceptId', concept.id);
                      setSelectedConceptGloss(concept.gloss);
                      setConceptSearch('');
                      setShowConceptDropdown(false);
                      // Auto-fill meaning if it's currently empty
                      if (!meaningValue || meaningValue.trim() === '') {
                        setValue('meaning', concept.gloss);
                      }
                    }}
                  >
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {concept.gloss}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      #{concept.id}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="body-xs text-neutral-500 mt-1">
              Leave blank, and a new concept will be created automatically using
              the Meaning provided above.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="body-small font-medium text-neutral-900 dark:text-neutral-100">
          Phonics (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. a-la-fi-a"
          className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${errors.phonics ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}`}
          {...register('phonics')}
        />
        {errors.phonics && (
          <p className="body-xs text-red-500">{errors.phonics.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="body-small font-medium text-neutral-900 dark:text-neutral-100">
            Language
          </label>
          <select
            className="w-full h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            {...register('languageId', { valueAsNumber: true })}
          >
            <option value={0} disabled>
              Select language...
            </option>
            {languages.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
          {errors.languageId && (
            <p className="body-xs text-red-500 mt-1">
              {errors.languageId.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="body-small font-medium text-neutral-900 dark:text-neutral-100">
            Part of Speech
          </label>
          <select
            className="w-full h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            {...register('partOfSpeechId', { valueAsNumber: true })}
          >
            <option value={0} disabled>
              Select POS...
            </option>
            {partsOfSpeech.map(pos => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </select>
          {errors.partOfSpeechId && (
            <p className="body-xs text-red-500 mt-1">
              {errors.partOfSpeechId.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="body-small font-medium text-neutral-900 dark:text-neutral-100">
          Related Domains
        </label>
        <div className="relative">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={domainInput}
              onChange={e => setDomainInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Science, Medical (Press Enter)"
              className="flex-1 h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddDomain()}
              className="px-3"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Domain Suggestions */}
          {domainSuggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg max-h-48 overflow-y-auto mt-1">
              {domainSuggestions.map(domain => (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => handleAddDomain(domain.name)}
                  className="w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 transition-colors"
                >
                  {domain.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {domains.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {domains.map(domain => (
              <span
                key={domain}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
              >
                {domain}
                <button
                  type="button"
                  onClick={() => handleRemoveDomain(domain)}
                  className="ml-2 hover:text-red-500 dark:hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.domains && (
          <p className="body-xs text-red-500">{errors.domains.message}</p>
        )}
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
        <Button
          type="button"
          variant="outline"
          onClick={() => onClose(false)}
          disabled={loading || isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading || isSubmitting}
          // Add loading spinner prop if supported, otherwise rely on disabled state
          {...(loading || isSubmitting ? { 'data-loading': true } : {})}
        >
          {isEditing ? 'Save Changes' : 'Create Term'}
        </Button>
      </div>
    </form>
  );

  return isOpen
    ? Modal(
        <>{isEditing ? 'Edit Dictionary Term' : 'Add New Dictionary Term'}</>,
        formBody,
        () => onClose(false),
        false,
        'w-full max-w-2xl'
      )
    : null;
}
