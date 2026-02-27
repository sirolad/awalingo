'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getOnboardingSeen } from '@/lib/onboarding';
import { APP_NAME } from '@/lib/brand';

export default function SplashPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const seen = getOnboardingSeen();

    // If user already saw onboarding, wait for auth hydration then redirect immediately
    if (seen) {
      if (isLoading) return; // wait until auth state is known
      if (isAuthenticated) {
        router.replace('/home');
      } else {
        router.replace('/signin');
      }
      return;
    }

    // Otherwise, show splash and navigate to onboarding after 3s
    const timer = setTimeout(() => {
      router.push('/onboarding/1');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: 'easeOut',
        }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
          {APP_NAME}
        </h1>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex space-x-1">
          {[0, 0.2, 0.4].map((delay, index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
