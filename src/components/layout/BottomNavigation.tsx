import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Vote, Lightbulb, Book, Home, BookPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
      className={`flex flex-row items-center gap-1 py-2 px-3 ${active ? 'rounded-full' : ''} transition-colors ${
        active
          ? 'text-primary-800 dark:text-primary-200 bg-stone-200 dark:bg-neutral-700'
          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { can } = useAuth();

  const navItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: pathname === '/home' ? 'Home' : '',
      href: '/home',
    },
    {
      icon: <Book className="w-5 h-5" />,
      label: pathname === '/dictionary' ? 'Dictionary' : '',
      href: '/dictionary',
    },
    {
      icon: <BookPlus className="w-5 h-5" />,
      label: pathname === '/dictionary/request' ? 'Request' : '',
      href: '/dictionary/request',
    },
    {
      icon: <Vote className="w-5 h-5" />,
      label:
        pathname === '/vote'
          ? 'Vote'
          : can('rate:neos') && pathname === '/jury'
            ? 'Jury'
            : '',
      href: can('rate:neos') ? '/jury' : '/vote',
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      label: pathname === '/suggest' ? 'Curation' : '',
      href: '/suggest',
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-around"
    >
      {navItems.map(item => (
        <NavItem
          key={item.href}
          icon={item.icon}
          label={item.label}
          href={item.href}
          active={
            pathname === item.href ||
            (pathname === '/vote' && can('rate:neos') && item.href === '/jury')
          }
          onClick={() => handleNavigation(item.href)}
        />
      ))}
    </motion.nav>
  );
}
