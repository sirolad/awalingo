'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AdminTermData, createAdminTerm, updateAdminTerm } from '@/actions/admin-terms';
import { getSourceLanguages, getPartsOfSpeech } from '@/actions/catalog';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

const termSchema = z.object({
  text: z.string().min(1, 'Word text is required').max(100),
  meaning: z.string().min(1, 'Meaning is required'),
  phonics: z.string().optional(),
  languageId: z.number().positive('Language is required'),
  partOfSpeechId: z.number().positive('Part of Speech is required'),
  domainsList: z.string().optional(), // We'll split this comma-separated string
});

type TermFormValues = z.infer<typeof termSchema>;

interface TermDialogProps {
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
  termToEdit: AdminTermData | null;
}

export function TermDialog({ isOpen, onClose, termToEdit }: TermDialogProps) {
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<{ id: number; name: string }[]>([]);
  const [partsOfSpeech, setPartsOfSpeech] = useState<{ id: number; name: string }[]>([]);

  const isEditing = !!termToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      text: '',
      meaning: '',
      phonics: '',
      languageId: 0,
      partOfSpeechId: 0,
      domainsList: '',
    },
  });

  useEffect(() => {
    Promise.all([getSourceLanguages(), getPartsOfSpeech()]).then(([langs, pos]) => {
      setLanguages(langs);
      setPartsOfSpeech(pos);
    });
  }, []);

  useEffect(() => {
    if (termToEdit && isOpen) {
      reset({
        text: termToEdit.text,
        meaning: termToEdit.meaning,
        phonics: termToEdit.phonics || '',
        languageId: termToEdit.language.id,
        partOfSpeechId: termToEdit.partOfSpeech.id,
        domainsList: termToEdit.domains.map((d) => d.domain.name).join(', '),
      });
    } else if (!termToEdit && isOpen) {
      reset({
        text: '',
        meaning: '',
        phonics: '',
        languageId: 0,
        partOfSpeechId: 0,
        domainsList: '',
      });
    }
  }, [termToEdit, isOpen, reset]);

  const onSubmit = async (data: TermFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', data.text);
      formData.append('meaning', data.meaning);
      if (data.phonics) formData.append('phonics', data.phonics);
      formData.append('languageId', data.languageId.toString());
      formData.append('partOfSpeechId', data.partOfSpeechId.toString());
      
      const domainArray = data.domainsList
        ? data.domainsList.split(',').map((d) => d.trim()).filter(Boolean)
        : [];
      formData.append('domains', JSON.stringify(domainArray));

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
        <label className="body-small font-medium text-neutral-900 dark:text-neutral-100">Word Text</label>
        <input
          type="text"
          placeholder="e.g. Alafia"
          className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${errors.text ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}`}
          {...register('text')}
        />
        {errors.text && <p className="body-xs text-red-500">{errors.text.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="body-small font-medium text-neutral-900 dark:text-neutral-100">Meaning</label>
        <input
          type="text"
          placeholder="e.g. Peace"
          className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${errors.meaning ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}`}
          {...register('meaning')}
        />
        {errors.meaning && <p className="body-xs text-red-500">{errors.meaning.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="body-small font-medium text-neutral-900 dark:text-neutral-100">Phonics (Optional)</label>
        <input
          type="text"
          placeholder="e.g. a-la-fi-a"
          className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${errors.phonics ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}`}
          {...register('phonics')}
        />
        {errors.phonics && <p className="body-xs text-red-500">{errors.phonics.message}</p>}
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
              <option value={0} disabled>Select language...</option>
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            {errors.languageId && (
              <p className="body-xs text-red-500 mt-1">{errors.languageId.message}</p>
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
              <option value={0} disabled>Select POS...</option>
              {partsOfSpeech.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
            {errors.partOfSpeechId && (
              <p className="body-xs text-red-500 mt-1">{errors.partOfSpeechId.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="body-small font-medium text-neutral-900 dark:text-neutral-100">Domains (comma-separated)</label>
          <input
            type="text"
            placeholder="e.g. Science, Biology, Medicine"
            className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${errors.domainsList ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}`}
            {...register('domainsList')}
          />
          {errors.domainsList && <p className="body-xs text-red-500">{errors.domainsList.message}</p>}
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

  return isOpen ? Modal(
    <>{isEditing ? 'Edit Dictionary Term' : 'Add New Dictionary Term'}</>,
    formBody,
    () => onClose(false),
    false // we handle the close button inside the form footer
  ) : null;
}
