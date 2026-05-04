'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

interface DeleteTripButtonProps {
  tripId: string;
  onDeleted: (tripId: string) => void;
}

export function DeleteTripButton({ tripId, onDeleted }: DeleteTripButtonProps) {
  const { session } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!session?.access_token) return;

    setIsDeleting(true);

    try {
      const res = await fetch('/api/trips/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tripId }),
      });

      if (res.ok) {
        onDeleted(tripId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete trip');
      }
    } catch (error) {
      alert('Something went wrong. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-[#f90680] border-4 border-black text-white font-black uppercase text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isDeleting ? 'DELETING...' : 'YES, DELETE'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-4 py-2 bg-white border-4 border-black text-black font-black uppercase text-sm hover:bg-gray-100 transition-colors"
        >
          CANCEL
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 bg-white border-4 border-black text-[#f90680] font-black uppercase text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
      title="Delete trip"
    >
      <span className="material-symbols-outlined text-xl">delete</span>
      DELETE
    </button>
  );
}