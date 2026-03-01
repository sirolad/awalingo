'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Users,
  BarChart3,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  FileCheck2,
  Clock,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { getQuizQuestionCount } from '@/actions/quiz';
import { getTotalUserCount } from '@/actions/auth';
import { getPendingReviewsCount } from '@/actions/review';
import { getTotalAdminTermCount } from '@/actions/admin-terms';
import { AdminLayout } from '@/components/admin/AdminLayout';

// ─── Metric card data (placeholder) ──────────────────────────────────────────
const getMetricsBase = (
  userCount: number | string,
  pendingCount: number | string,
  termCount: number | string
) => [
  {
    label: 'Total Users',
    value: userCount,
    trend: null,
    icon: Users,
    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Pending Reviews',
    value: pendingCount,
    trend: null,
    icon: Clock,
    color:
      'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  },
  {
    label: 'Approved Words',
    value: '—',
    trend: null,
    icon: FileCheck2,
    color:
      'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  },
  {
    label: 'Dictionary Entries',
    value: termCount,
    trend: null,
    icon: TrendingUp,
    color:
      'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { appUser, isLoading: authLoading } = useAuth();
  const { can } = usePermissions();
  const [questionCount, setQuestionCount] = useState<number | string>('—');
  const [userCount, setUserCount] = useState<number | string>('—');
  const [pendingCount, setPendingCount] = useState<number | string>('—');
  const [termCount, setTermCount] = useState<number | string>('—');

  useEffect(() => {
    if (authLoading) return;
    if (!appUser) {
      router.push('/signin');
      return;
    }
    if (!can('view:admin')) {
      router.push('/home');
      return;
    }

    const fetchDashboardMetrics = async () => {
      const [qcRes, ucRes, prRes, tcRes] = await Promise.all([
        getQuizQuestionCount(),
        getTotalUserCount(),
        getPendingReviewsCount(),
        getTotalAdminTermCount(),
      ]);
      if (qcRes.success) setQuestionCount(qcRes.count!);
      if (ucRes.success) setUserCount(ucRes.count!);
      if (prRes.success) setPendingCount(prRes.count!);
      if (tcRes.success) setTermCount(tcRes.count!);
    };
    fetchDashboardMetrics();
  }, [appUser, authLoading, can, router]);

  if (authLoading || !appUser) return null;

  const dashboardMetrics = [
    ...getMetricsBase(userCount, pendingCount, termCount),
    {
      label: 'Question Bank',
      value: questionCount,
      trend: null,
      icon: HelpCircle,
      color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <AdminLayout
      title="Admin Dashboard"
      description="Platform management and oversight"
    >
      <div className="p-4 md:p-6 lg:p-8">
        {/* Section heading */}
        <div className="mb-6">
          <h2 className="heading-5 text-neutral-900 dark:text-neutral-100">
            Overview
          </h2>
          <p className="body-small text-neutral-500 dark:text-neutral-400 mt-0.5">
            Platform metrics at a glance — live data coming soon.
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {dashboardMetrics.map(metric => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${metric.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {metric.trend !== null &&
                    (metric.trend >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ))}
                </div>
                <p className="heading-4 text-neutral-950 dark:text-neutral-50 mb-0.5">
                  {metric.value}
                </p>
                <p className="text-caption text-neutral-500 dark:text-neutral-400">
                  {metric.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="mb-6">
          <h2 className="heading-5 text-neutral-900 dark:text-neutral-100 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/requests')}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center gap-4 hover:shadow-md hover:border-neutral-200 dark:hover:border-neutral-700 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="body-small font-semibold text-neutral-800 dark:text-neutral-200">
                  Review Requests
                </p>
                <p className="text-caption text-neutral-500 dark:text-neutral-400 truncate">
                  Approve or reject pending translations
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 ml-auto shrink-0" />
            </button>

            {/* Placeholder cards for future sections */}
            {[
              {
                label: 'Manage Users',
                desc: 'View and edit user roles',
                icon: Users,
                color:
                  'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                href: null,
              },
              {
                label: 'Quiz Settings',
                desc: 'Manage Curator test questions',
                icon: FileCheck2,
                color:
                  'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                href: '/admin/quiz',
              },
              {
                label: 'View Analytics',
                desc: 'Platform usage statistics',
                icon: BarChart3,
                color:
                  'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                href: null,
              },
            ].map(item => {
              const Icon = item.icon;

              if (item.href) {
                return (
                  <button
                    key={item.label}
                    onClick={() => router.push(item.href as string)}
                    className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center gap-4 hover:shadow-md hover:border-neutral-200 dark:hover:border-neutral-700 transition-all text-left group"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${item.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="body-small font-semibold text-neutral-800 dark:text-neutral-200">
                        {item.label}
                      </p>
                      <p className="text-caption text-neutral-500 dark:text-neutral-400 truncate">
                        {item.desc}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 ml-auto shrink-0" />
                  </button>
                );
              }

              return (
                <div
                  key={item.label}
                  className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center gap-4 opacity-50 cursor-not-allowed"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="body-small font-semibold text-neutral-800 dark:text-neutral-200">
                      {item.label}
                    </p>
                    <p className="text-caption text-neutral-500 dark:text-neutral-400 truncate">
                      {item.desc}
                    </p>
                  </div>
                  <span className="text-caption font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full ml-auto shrink-0">
                    Soon
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
