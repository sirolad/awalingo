'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminDomainData,
  createAdminDomain,
  updateAdminDomain,
} from '@/actions/admin-domains';

interface DomainDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  domainToEdit: AdminDomainData | null;
  onSuccess: () => void;
}

export function DomainDialog({
  isOpen,
  onOpenChange,
  domainToEdit,
  onSuccess,
}: DomainDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (domainToEdit) {
        setName(domainToEdit.name);
      } else {
        setName('');
      }
      setErrors({});
    }
  }, [isOpen, domainToEdit]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData();
    formData.append('name', name);

    let result;
    if (domainToEdit) {
      result = await updateAdminDomain(domainToEdit.id, formData);
    } else {
      result = await createAdminDomain(formData);
    }

    if (result.success) {
      toast.success(
        domainToEdit
          ? 'Domain updated successfully'
          : 'Domain created successfully'
      );
      onSuccess();
      onOpenChange(false);
    } else {
      if (typeof result.error === 'string') {
        toast.error(result.error);
      } else if (result.error) {
        setErrors(result.error as Record<string, string[]>);
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {domainToEdit ? 'Edit Domain' : 'Create New Domain'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Domain Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-neutral-400"
              placeholder="e.g. Technology"
            />
            {errors?.name && (
              <p className="text-sm text-red-500">{errors.name[0]}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name}
              className="min-w-[100px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : domainToEdit ? (
                'Save Changes'
              ) : (
                'Create Domain'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
