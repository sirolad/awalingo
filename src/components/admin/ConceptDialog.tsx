'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AdminConceptData,
  createAdminConcept,
  updateAdminConcept,
} from '@/actions/admin-concepts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

const conceptSchema = z.object({
  gloss: z.string().min(1, 'Gloss is required').max(200),
});

type ConceptFormValues = z.infer<typeof conceptSchema>;

interface ConceptDialogProps {
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
  conceptToEdit: AdminConceptData | null;
}

export function ConceptDialog({
  isOpen,
  onClose,
  conceptToEdit,
}: ConceptDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!conceptToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConceptFormValues>({
    resolver: zodResolver(conceptSchema),
    defaultValues: {
      gloss: '',
    },
  });

  useEffect(() => {
    if (conceptToEdit && isOpen) {
      reset({
        gloss: conceptToEdit.gloss,
      });
    } else if (!conceptToEdit && isOpen) {
      reset({ gloss: '' });
    }
  }, [conceptToEdit, isOpen, reset]);

  const onSubmit = async (data: ConceptFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('gloss', data.gloss);

      let result;
      if (isEditing) {
        result = await updateAdminConcept(conceptToEdit.id, formData);
      } else {
        result = await createAdminConcept(formData);
      }

      if (result.success) {
        toast.success(
          `Concept ${isEditing ? 'updated' : 'created'} successfully`
        );
        onClose(true);
      } else {
        if (typeof result.error === 'object' && result.error !== null) {
          const firstError = Object.values(result.error)[0] as string[];
          toast.error(firstError?.[0] || 'Validation failed');
        } else {
          toast.error((result.error as string) || 'Failed to save concept');
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
          Gloss (Meaning Node)
        </label>
        <input
          type="text"
          placeholder="e.g. A state of tranquility or quiet"
          className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${errors.gloss ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'}`}
          {...register('gloss')}
        />
        {errors.gloss && (
          <p className="body-xs text-red-500">{errors.gloss.message}</p>
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
          {...(loading || isSubmitting ? { 'data-loading': true } : {})}
        >
          {isEditing ? 'Save Changes' : 'Create Concept'}
        </Button>
      </div>
    </form>
  );

  return isOpen
    ? Modal(
        <>{isEditing ? 'Edit Concept' : 'Add New Concept'}</>,
        formBody,
        () => onClose(false),
        false,
        'w-full max-w-2xl'
      )
    : null;
}
