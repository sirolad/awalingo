import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Vote,
  Lightbulb,
  Book,
  User,
  LogOut,
  CircleUserRound,
  BookPlus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { MyCommunityTag } from '@/components/ui/MyCommunityTag';
import { APP_NAME } from '@/lib/brand';
import Image from 'next/image';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all nav-secondary ${
        active
          ? 'text-primary-800 dark:text-primary-200 bg-primary-50 dark:bg-primary-900/30 shadow-sm'
          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function TopNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { appUser, logout, userRole, userNeoCommunity, can } = useAuth();
  const user = appUser;

  const navItems = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Home',
      href: '/home',
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      label: 'Suggest',
      href: '/suggest',
    },
    {
      icon: <Vote className="w-5 h-5" />,
      label: can('rate:neos') ? 'Jury' : 'Vote',
      href: can('rate:neos') ? '/jury' : '/vote',
    },
    {
      icon: <Book className="w-5 h-5" />,
      label: 'Dictionary',
      href: '/dictionary',
    },
    {
      icon: <BookPlus className="w-5 h-5" />,
      label: 'Request',
      href: '/dictionary/request',
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleLogout = () => {
    logout();
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 lg:px-8 py-4 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo/Brand */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          onClick={() => handleNavigation('/home')}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm dark:text-white ">
              {APP_NAME[0]}
            </span>
          </div>
          <span className="heading-6 text-neutral-950 dark:text-neutral-50">
            {APP_NAME}
          </span>
        </motion.button>

        {/* Main Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex items-center gap-2"
        >
          {navItems.map(item => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
              onClick={() => handleNavigation(item.href)}
            />
          ))}
        </motion.div>

        {/* User Actions */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="flex items-center gap-3"
        >
          {user && (
            <>
              {/* Community Tag - Visible on desktop */}
              <MyCommunityTag
                userNeoCommunity={userNeoCommunity}
                user={user}
                className="lg:flex hidden"
                hideAvatar={true}
              />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Info */}
              <button
                onClick={handleProfile}
                className="hidden lg:flex items-center gap-3 px-4 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="text-lg">
                  {user?.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user?.name || 'Contributor'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <CircleUserRound className="w-10 h-10 text-neutral-400" />
                  )}
                </div>
                <div className="body-small text-left">
                  <div className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {user.name || user.email}
                  </div>
                  <div className="text-caption text-neutral-600 dark:text-neutral-400">
                    {userRole}
                  </div>
                </div>
              </button>

              {/* User Avatar/Menu for smaller screens */}
              <div className="lg:hidden">
                <button
                  onClick={handleProfile}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="text-lg">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user?.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <CircleUserRound className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>
                  <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.nav>
  );
}
