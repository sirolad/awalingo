'use client';

import { JSX } from 'react';
import { Button } from './Button';

export function Modal(
  title: JSX.Element,
  body: JSX.Element,
  onClose?: () => void,
  showclose: boolean = true,
  className?: string
) {
  return (
    <div className="fixed inset-0 bg-[#111111CC] bg-opacity-[0.5] overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div
        className={`py-8 px-4 border ${className || 'w-90'} shadow-lg rounded-md bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800`}
      >
        <div className="text-center dark:text-neutral-50 dark:">
          <div className="text-[24px] font-[500] text-[#111111CC] dark:text-[#FFFFFFCC] justify-center flex">
            {title}
          </div>
          <div className="mt-2 px-7 py-3 dark:text-neutral-300 text-[15px] leading-relaxed text-[#111111CC] dark:text-[#FFFFFFCC] justify-center">
            {body}
          </div>
          <div className="flex justify-center mt-4">
            {showclose && (
              <Button variant="primary" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
