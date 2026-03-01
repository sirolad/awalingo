'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  ChevronRight,
  Menu,
  X,
  FileCheck2,
  Home,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
    label: 'Dictionary Concepts',
    icon: BookOpen,
    href: '/admin/dictionary-concepts',
    active: true,
  },
  {
    label: 'Review Requests',
    icon: ClipboardList,
    href: '/admin/requests',
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

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  headerActions?: React.ReactNode;
}

export function AdminLayout({
  children,
  title,
  description,
  headerActions,
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { appUser } = useAuth();
  const { role } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!appUser) return null;

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
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto w-full">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isCurrent = pathname === item.href;
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
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top header */}
        <header className="h-16 shrink-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-4 px-4 md:px-6 sticky top-0 z-10 w-full">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 max-w-full">
            <h1 className="heading-6 text-neutral-950 dark:text-neutral-50 truncate">
              {title}
            </h1>
            {description && (
              <p className="text-caption text-neutral-500 dark:text-neutral-400 hidden md:block truncate">
                {description}
              </p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3 shrink-0">
            {headerActions && (
              <div className="hidden sm:flex items-center gap-3">
                {headerActions}
              </div>
            )}

            <ThemeToggle />

            <button
              onClick={() => router.push('/home')}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex"
              title="Go Home"
            >
              <Home className="w-5 h-5" />
            </button>
            {/* Avatar (desktop, mobile already has sidebar footer) */}
            <button
              onClick={() => router.push('/profile')}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 hover:opacity-80 transition-opacity items-center justify-center bg-neutral-100 dark:bg-neutral-800 shrink-0 flex"
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
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
