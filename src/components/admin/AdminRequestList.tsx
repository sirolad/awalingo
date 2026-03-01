'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getAllRequests } from '@/actions/review';
import { toast } from 'sonner';

interface PartOfSpeech {
  id: number;
  name: string;
  code: string;
}

interface Request {
  id: number;
  word: string;
  meaning: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  partOfSpeechId: number;
  partOfSpeech: PartOfSpeech;
  user: {
    name: string | null;
  };
  targetLanguage: {
    name: string;
  };
  createdAt: Date;
}

export function AdminRequestList() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  useEffect(() => {
    loadRequests(0);
  }, []);

  const loadRequests = async (currentOffset: number) => {
    if (currentOffset === 0) setLoading(true);
    else setLoadingMore(true);

    const res = await getAllRequests(LIMIT, currentOffset);

    if (res.success && res.data) {
      if (currentOffset === 0) {
        setRequests(res.data as unknown as Request[]);
      } else {
        setRequests(prev => [...prev, ...(res.data as unknown as Request[])]);
      }
      setHasMore(res.data.length === LIMIT);
      setOffset(currentOffset + LIMIT);
    } else {
      toast.error('Failed to load requests');
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    loadRequests(offset);
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center p-12 text-neutral-500 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
        No requests found in the system.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400">
                <th className="py-3 px-4 font-semibold text-sm">Word</th>
                <th className="py-3 px-4 font-semibold text-sm">Meaning</th>
                <th className="py-3 px-4 font-semibold text-sm">Language</th>
                <th className="py-3 px-4 font-semibold text-sm">User</th>
                <th className="py-3 px-4 font-semibold text-sm">Status</th>
                <th className="py-3 px-4 font-semibold text-sm">
                  Rejection Reason
                </th>
                <th className="py-3 px-4 font-semibold text-sm">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {requests.map(req => (
                <tr
                  key={req.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {req.word}
                      </span>
                      {req.partOfSpeech && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                          {req.partOfSpeech.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-300 max-w-xs truncate"
                    title={req.meaning || ''}
                  >
                    {req.meaning || (
                      <span className="text-neutral-400 italic">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {req.targetLanguage.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {req.user.name || 'Unknown'}
                  </td>
                  <td className="py-3 px-4">
                    {req.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {req.status === 'REJECTED' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50 cursor-help">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {req.rejectionReason || 'No reason provided'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {req.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td
                    className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-300 max-w-xs truncate"
                    title={req.rejectionReason || ''}
                  >
                    {req.status === 'REJECTED' ? (
                      req.rejectionReason || (
                        <span className="text-neutral-400 italic">
                          None provided
                        </span>
                      )
                    ) : (
                      <span className="text-neutral-400 italic">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-500 whitespace-nowrap">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center pt-4 pb-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-full"
            leftIcon={
              loadingMore ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : undefined
            }
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
