'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  ArrowLeft,
  Pencil,
  Settings,
  Megaphone,
  FileText,
  LogOut,
  User as UserIcon,
  Award,
  ShieldCheck,
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { Layout } from '@/components/layout/Layout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { formatJoinedDate } from '@/lib/utils';
import { PermissionGate } from '@/components/auth/PermissionGate';

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { appUser, logout, userNeoCommunity, can } = useAuth();
  const user = appUser;

  const isDarkMode = theme === 'dark';

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/signin');
  };

  return (
    <Layout className="bg-neutral-50 dark:bg-neutral-950">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="max-w-md lg:max-w-6xl mx-auto min-h-screen flex flex-col lg:py-8">
          {/* Mobile Header */}
          <header className="py-4 flex items-center relative lg:hidden">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 heading-4 text-neutral-950 dark:text-neutral-50">
              Profile
            </h1>
          </header>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <div>
              <h1 className="heading-2 text-neutral-950 dark:text-neutral-50">
                My Profile
              </h1>
              <p className="body-base text-neutral-500 dark:text-neutral-400 mt-1">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <div className="flex-1 pb-8 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Profile & Stats */}
            <div className="space-y-4 lg:space-y-6 lg:col-span-4">
              {/* Profile Card */}
              <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-6 flex flex-col items-center text-center shadow-sm h-fit">
                <div className="relative mb-4">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-sm transition-transform hover:scale-105">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name || 'Profile'}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                        <UserIcon className="w-10 h-10 lg:w-14 lg:h-14 text-primary-600" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-neutral-950 dark:bg-neutral-100 rounded-full p-1.5 lg:p-2 border-2 border-white dark:border-neutral-800 cursor-pointer hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                    <Pencil className="w-3 h-3 lg:w-4 lg:h-4 text-white dark:text-neutral-900" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h2 className="heading-5 text-neutral-950 dark:text-neutral-50">
                    {user?.name || 'User2025'}
                  </h2>
                </div>

                <p className="body-small text-neutral-500 dark:text-neutral-400 mb-4 lg:mb-6">
                  {user?.email || 'neouser@gmail.com'}
                </p>

                <div className="w-full pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-caption text-neutral-400 dark:text-neutral-500">
                    {formatJoinedDate(user?.createdAt)}
                  </p>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 lg:p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-amber-400 rounded-full flex items-center justify-center border-4 border-amber-200 dark:border-amber-500/30">
                    <Award className="w-6 h-6 lg:w-7 lg:h-7 text-neutral-900 fill-current" />
                  </div>
                  <div>
                    <p className="text-caption lg:body-small text-neutral-500 dark:text-neutral-400">
                      Total Experience Points
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="heading-5 text-neutral-950 dark:text-neutral-50">
                        450 Cowries
                      </span>
                      <span className="text-xl lg:text-2xl">🐚</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop-only Curator CTA (moved from bottom) */}
              {!can('vote:suggestions') ? (
                <div className="hidden lg:block">
                  <div className="bg-neutral-950 rounded-[2rem] p-6 text-white text-center shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:translate-y-0 transition-transform duration-700" />
                    <h3 className="heading-5 mb-2 relative z-10">
                      Become a Curator
                    </h3>
                    <p className="body-small text-neutral-400 mb-6 relative z-10">
                      Join our community of language experts and help preserve
                      our heritage.
                    </p>
                    <Button
                      onClick={() => router.push('/become-curator')}
                      className="w-full bg-white text-neutral-950 hover:bg-neutral-100 border-none relative z-10 rounded-full text-base font-semibold h-12"
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right Column: Settings */}
            <div className="lg:col-span-8">
              <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-2 mb-0 lg:p-8 shadow-sm h-fit">
                <div className="flex items-center gap-3 lg:mb-8 border-b border-neutral-100 dark:border-neutral-800 pb-2 lg:pb-6">
                  <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="heading-5 text-neutral-950 dark:text-neutral-50">
                      Settings
                    </h3>
                    <p className="body-small text-neutral-500 dark:text-neutral-400 hidden sm:block">
                      Manage preferences and notifications
                    </p>
                  </div>
                </div>

                <div className="space-y-6 lg:space-y-8">
                  {/* App Preferences */}
                  <div className="space-y-2">
                    <h4 className="text-label text-neutral-400 uppercase tracking-wider hidden sm:block">
                      Preferences
                    </h4>

                    {/* Notifications */}
                    <div className="flex items-center justify-between p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                      <div className="flex flex-col">
                        <span className="body-small font-medium text-neutral-900 dark:text-neutral-100">
                          Disallow in-App Notifications
                        </span>
                        <span className="text-caption text-neutral-500 dark:text-neutral-400 hidden sm:block">
                          Receive updates about your contributions
                        </span>
                      </div>
                      <Switch size="sm" />
                    </div>

                    {/* Dark Mode */}
                    <div className="flex items-center justify-between p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                      <div className="flex flex-col">
                        <span className="body-small font-medium text-neutral-900 dark:text-neutral-100">
                          Switch to Dark Mode
                        </span>
                        <span className="text-caption text-neutral-500 dark:text-neutral-400 hidden sm:block">
                          Switch between light and dark themes
                        </span>
                      </div>
                      <Switch
                        size="sm"
                        checked={isDarkMode}
                        onCheckedChange={handleThemeToggle}
                      />
                    </div>
                  </div>

                  <div className="h-px bg-neutral-100 dark:bg-neutral-800 w-full" />

                  {/* Community & Support */}
                  <div className="space-y-2">
                    <h4 className="text-label text-neutral-400 uppercase tracking-wider hidden sm:block">
                      Community
                    </h4>

                    {/* Awalingo Community */}
                    <div className="flex items-center justify-between cursor-pointer p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <span className="body-small font-medium text-neutral-700 dark:text-neutral-300">
                          Awalingo Community
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                        <ReactCountryFlag
                          countryCode={userNeoCommunity?.flagIcon || 'NG'}
                          svg
                          className="w-4 h-4 rounded-sm"
                        />
                        <span className="text-caption font-medium text-neutral-600 dark:text-neutral-400">
                          {userNeoCommunity?.name || 'Yoruba'}
                        </span>
                      </div>
                    </div>

                    {/* Community Notes */}
                    <div className="flex items-center gap-3 cursor-pointer p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="body-small font-medium text-neutral-700 dark:text-neutral-300">
                        Community Guidelines & Notes
                      </span>
                    </div>
                  </div>

                  {/* Administration — visible to admins only */}
                  <PermissionGate permission="view:admin">
                    <div className="h-px bg-neutral-100 dark:bg-neutral-800 w-full" />
                    <div className="space-y-2">
                      <h4 className="text-label text-neutral-400 uppercase tracking-wider hidden sm:block">
                        Administration
                      </h4>
                      <div
                        className="flex items-center gap-3 cursor-pointer p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors group"
                        onClick={() => router.push('/admin')}
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="body-small font-medium text-neutral-700 dark:text-neutral-300">
                          Admin Dashboard
                        </span>
                      </div>
                    </div>
                  </PermissionGate>

                  {/* Mobile Log Out (Hidden on Desktop) */}
                  <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 lg:hidden">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="body-small font-medium">Log Out</span>
                    </button>
                  </div>
                </div>
                {!can('vote:suggestions') ? (
                  <div className="mt-8 lg:hidden">
                    <Button
                      onClick={() => router.push('/become-curator')}
                      className="w-full bg-neutral-950 hover:bg-neutral-900 text-white rounded-full h-12 md:h-14 text-base md:text-lg font-semibold"
                    >
                      Become a Curator
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
