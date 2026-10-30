import React from 'react';
import type { AuthMethodId } from '@/lib/authProviders';

interface Props {
  id: AuthMethodId;
  className?: string;
}

/** 簡潔品牌色標示（非官方商標複製品） */
export const ProviderBrandIcon: React.FC<Props> = ({ id, className = 'w-5 h-5' }) => {
  switch (id) {
    case 'google':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
          />
          <path
            fill="#34A853"
            d="M6.6 14.3l-.9.7-2.5 1.9C4.8 19.7 8.1 22 12 22c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.8 0-5.1-1.9-6-4.4z"
          />
          <path
            fill="#4A90E2"
            d="M3.2 7.1C2.4 8.6 2 10.2 2 12s.4 3.4 1.2 4.9l3.4-2.6C6.2 13.5 6 12.8 6 12s.2-1.5.6-2.3L3.2 7.1z"
          />
          <path
            fill="#FBBC05"
            d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.7 2 12 2 8.1 2 4.8 4.3 3.2 7.1l3.4 2.6C7 7.9 9.2 6 12 6z"
          />
        </svg>
      );
    case 'line':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <rect width="24" height="24" rx="6" fill="#06C755" />
          <path
            fill="#fff"
            d="M12 5.5c-3.7 0-6.7 2.4-6.7 5.4 0 2.7 2.4 4.9 5.6 5.3.2 0 .5.1.6.3l.1.5c0 .2.1.5-.3.8-.1.1-.2.2 0 .3.9-.1 2.1-.7 2.9-1.2.1-.1.2-.1.3-.1 2.8-.4 4.9-2.5 4.9-5.1 0-3-3-5.4-6.7-5.4z"
          />
        </svg>
      );
    case 'apple':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#ffffff"
            d="M16.4 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.2-2.4-.1 0-2.2-.8-2.2-3.7zM14.3 6.3c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-1 2.6 1 .1 1.9-.5 2.6-1.2z"
          />
        </svg>
      );
    case 'email':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="#64748b" strokeWidth="1.8" />
          <path d="M4 7l8 6 8-6" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <rect width="24" height="24" rx="6" fill="#1877F2" />
          <path
            fill="#fff"
            d="M15.5 8.5h-1.3c-.5 0-.8.3-.8.9v1.3H15l-.3 2.2h-1.3V19h-2.3v-5.1H9.8v-2.2h1.3V9.2c0-1.9 1.1-2.9 2.9-2.9.8 0 1.5.1 1.5.1v1.9z"
          />
        </svg>
      );
    case 'github':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#ffffff"
            d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.9 9.6.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.4-3.4-1.4-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.6-.3 2.4-.3s1.6.1 2.4.3c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1.3 6.9-5.1 6.9-9.6C22 6.6 17.5 2 12 2z"
          />
        </svg>
      );
    case 'discord':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#5865F2"
            d="M19.3 5.2A16 16 0 0 0 15.4 4l-.2.4a14 14 0 0 1 3.1 1.4 15 15 0 0 0-12.6 0A14 14 0 0 1 8.8 4.4L8.6 4a16 16 0 0 0-3.9 1.2C2.2 9.1 1.5 12.9 1.8 16.6a16 16 0 0 0 4.9 2.5l.6-.9a10 10 0 0 1-1.5-.7l.4-.3c3.2 1.5 6.7 1.5 9.8 0l.4.3c-.5.3-1 .5-1.5.7l.6.9a16 16 0 0 0 4.9-2.5c.4-4.3-.6-8-2.1-11.4zM9.1 14.3c-.9 0-1.7-.9-1.7-1.9s.7-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9zm5.8 0c-.9 0-1.7-.9-1.7-1.9s.7-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9z"
          />
        </svg>
      );
    default:
      return null;
  }
};
