'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  ClipboardList,
  Settings2,
  ShieldCheck,
  User as UserIcon,
  TrendingUp,
  TrendingDown,
  FileCheck2,
  Clock,
  ChevronRight,
  Menu,
  X,
  HelpCircle,
  Home,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { getQuizQuestionCount } from '@/actions/quiz';
import { getTotalUserCount } from '@/actions/auth';
import { getPendingReviewsCount } from '@/actions/review';

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/admin', active: true },
  { label: 'Users', icon: Users, href: '/admin/users', active: false },
  {
    label: 'Dictionary Terms',
    icon: BookOpen,
    href: '/admin/dictionary-terms',
    active: true,
  },
  {
    label: 'Review Requests',
    icon: ClipboardList,
    href: '/curator/review',
    active: true,
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    active: false,
  },
  {
    label: 'Quiz Settings',
    icon: FileCheck2,
    href: '/admin/quiz',
    active: true,
  },
  {
    label: 'Settings',
    icon: Settings2,
    href: '/admin/settings',
    active: false,
  },
  {
    label: 'Go Home',
    icon: Home,
    href: '/home',
    active: true,
  },
];

// ─── Metric card data (placeholder) ──────────────────────────────────────────
const getMetricsBase = (
  userCount: number | string,
  pendingCount: number | string
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
    label: 'Contributions',
    value: '—',
    trend: null,
    icon: TrendingUp,
    color:
      'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { appUser, isLoading: authLoading } = useAuth();
  const { role, can } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState<number | string>('—');
  const [userCount, setUserCount] = useState<number | string>('—');
  const [pendingCount, setPendingCount] = useState<number | string>('—');

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
      const [qcRes, ucRes, prRes] = await Promise.all([
        getQuizQuestionCount(),
        getTotalUserCount(),
        getPendingReviewsCount(),
      ]);
      if (qcRes.success) setQuestionCount(qcRes.count!);
      if (ucRes.success) setUserCount(ucRes.count!);
      if (prRes.success) setPendingCount(prRes.count!);
    };
    fetchDashboardMetrics();
  }, [appUser, authLoading, can, router]);

  if (authLoading || !appUser) return null;

  const dashboardMetrics = [
    ...getMetricsBase(userCount, pendingCount),
    {
      label: 'Question Bank',
      value: questionCount,
      trend: null,
      icon: HelpCircle,
      color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* ── Sidebar (desktop always visible, mobile drawer) ── */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-neutral-900
            border-r border-neutral-100 dark:border-neutral-800
            flex flex-col transition-transform duration-300
            lg:translate-x-0 lg:static lg:z-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Sidebar brand */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-neutral-100 dark:border-neutral-800">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="heading-6 text-neutral-950 dark:text-neutral-50">
              Admin
            </span>
            <button
              className="ml-auto lg:hidden text-neutral-500 hover:text-neutral-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isCurrent = item.href === '/admin';
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.active) {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }
                  }}
                  disabled={!item.active && !isCurrent}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors
                    ${
                      isCurrent
                        ? 'bg-neutral-950 dark:bg-neutral-100 text-white dark:text-neutral-900'
                        : item.active
                          ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          : 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="body-small font-medium">{item.label}</span>
                  {!item.active && !isCurrent && (
                    <span className="ml-auto text-caption text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer — user chip */}
          <div
            className="px-4 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            onClick={() => router.push('/profile')}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 shrink-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
              {appUser.avatar ? (
                <Image
                  src={appUser.avatar}
                  alt={appUser.name || 'Avatar'}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              ) : (
                <UserIcon className="w-5 h-5 text-neutral-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="body-small font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {appUser.name || 'Admin'}
              </p>
              <p className="text-caption text-rose-500 dark:text-rose-400 uppercase font-semibold tracking-wide">
                {role}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
          </div>
        </aside>
      </>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-4 px-4 md:px-6 sticky top-0 z-10">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="heading-6 text-neutral-950 dark:text-neutral-50">
              Admin Dashboard
            </h1>
            <p className="text-caption text-neutral-500 dark:text-neutral-400 hidden md:block">
              Platform management and oversight
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              title="Go Home"
            >
              <Home className="w-5 h-5" />
            </button>
            {/* Avatar (desktop, mobile already has sidebar footer) */}
            <button
              onClick={() => router.push('/profile')}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 hover:opacity-80 transition-opacity flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 shrink-0"
            >
              {appUser.avatar ? (
                <Image
                  src={appUser.avatar}
                  alt={appUser.name || 'Profile'}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              ) : (
                <UserIcon className="w-5 h-5 text-neutral-500" />
              )}
            </button>
          </div>
        </header>{' '}
        {/* Page body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
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
                onClick={() => router.push('/curator/review')}
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
        </main>
      </div>
    </div>
  );
}
