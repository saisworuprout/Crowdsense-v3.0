'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export function CloneButton({ tripId }: { tripId: string }) {
  const { user, session } = useAuth();
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClone = async () => {
    if (!user || !session?.access_token) {
      setMessage({ type: 'error', text: 'Please log in to clone this trip' });
      return;
    }

    setIsCloning(true);
    setMessage(null);

    try {
      const res = await fetch('/api/trips/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tripId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Trip cloned to your account!' });
        setTimeout(() => {
          router.push('/my-trips');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to clone trip' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClone}
        disabled={isCloning}
        className="w-full py-6 bg-white border-4 border-black text-2xl md:text-3xl font-black uppercase tracking-tight shadow-[8px_8px_0px_black] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_black] active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_black] transition-all flex items-center justify-center gap-3 group/btn disabled:opacity-50 cursor-pointer"
      >
        <span className="material-symbols-outlined text-3xl group-hover/btn:rotate-180 transition-transform duration-300">
          {isCloning ? 'hourglass_top' : 'content_copy'}
        </span>
        {isCloning ? 'CLONING...' : 'Clone Trip'}
      </button>
      {message && (
        <div className={`p-4 border-4 border-black font-black text-sm uppercase ${
          message.type === 'success' ? 'bg-[#00FF00]' : 'bg-[#f90680]'
        } text-white`}>
          {message.text}
        </div>
      )}
    </div>
  );
}