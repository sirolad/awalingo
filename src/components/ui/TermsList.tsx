import { TermWithNeoCount } from '@/types';
import { motion } from 'framer-motion';

interface TermsListProps {
  terms: TermWithNeoCount[];
  title?: string;
  onSelectTerm: (term: TermWithNeoCount) => void;
}

export function TermsList({ terms, title, onSelectTerm }: TermsListProps) {
  return (
    <div className="flex flex-col gap-4 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 bg-neutral-50 dark:bg-neutral-800">
      {title && (
        <span className="text-[16px] text-[#292929] font-[400] dark:text-neutral-400">
          {title}
        </span>
      )}
      {terms.length > 0 ? (
        <motion.div className="flex flex-row gap-4">
          {terms.map(t => (
            <button
              key={t.id}
              onClick={() => onSelectTerm(t)}
              className="font-medium text-neutral-50 mb-2 block bg-[#420FBD] px-4 py-2 rounded-full"
            >
              {t.text}
            </button>
          ))}
        </motion.div>
      ) : (
        <p className="text-center text-neutral-600 dark:text-neutral-400">
          No terms available for suggestion. Please check back later.
        </p>
      )}
    </div>
  );
}
