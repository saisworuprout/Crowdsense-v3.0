'use client';

import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { Trip } from '@/lib/types';

type TripStatus = 'upcoming' | 'draft' | 'past';

export default function MyTrips() {
  const { user, loading, session } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<TripStatus>('upcoming');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchTrips() {
      if (!user) return;

      let query = supabase
        .from('trips')
        .select(`
          id,
          title,
          destination,
          vibe,
          mission,
          start_date,
          end_date,
          image_url,
          status,
          duration_days,
          curator_handle,
          curator_avatar,
          curator_initials,
          itinerary_days ( id )
        `)
        .eq('user_id', user.id);

      if (activeTab === 'upcoming') {
        query = query.or('status.eq.upcoming,status.is.null');
      } else {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trips:', error);
      } else if (data) {
        const formattedTrips: Trip[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          desc: d.mission || d.vibe,
          days: d.duration_days || d.itinerary_days?.length || 1,
          handle: d.curator_handle || user.email?.split('@')[0] || 'Unknown',
          vibe: d.vibe,
          imageUrl: d.image_url || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=2000',
          avatarInit: d.curator_initials || d.curator_handle?.substring(0, 2).toUpperCase(),
          curator: {
            handle: d.curator_handle || user.email?.split('@')[0] || 'Unknown',
            avatar: d.curator_avatar || ''
          }
        }));
        setTrips(formattedTrips);
      }
      setFetching(false);
    }

    if (!loading) {
      if (user) {
        fetchTrips();
      } else {
        setFetching(false);
      }
    }
  }, [user, loading, activeTab]);

  const handleDelete = async (tripId: string) => {
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
        setTrips(prev => prev.filter(t => t.id !== tripId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete trip');
      }
    } catch (error) {
      alert('Something went wrong. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  if (loading || fetching) {
    return (
      <div className="bg-[#f8f5f7] min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 w-full flex items-center justify-center">
           <div className="text-4xl font-black uppercase">Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-[#f8f5f7] min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-8 py-16 flex flex-col gap-12">
        {/* Oversized Tabs */}
        <nav className="flex border-b-4 border-cs-black w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`font-black text-2xl md:text-[32px] uppercase px-8 py-4 tracking-[-0.05em] border-b-[8px] -mb-[4px] whitespace-nowrap transition-colors ${
              activeTab === 'upcoming'
                ? 'border-[#f90680] bg-white text-cs-black'
                : 'border-transparent text-cs-black hover:text-[#f90680]'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`font-black text-2xl md:text-[32px] uppercase px-8 py-4 tracking-[-0.05em] border-b-[8px] -mb-[4px] whitespace-nowrap transition-colors ${
              activeTab === 'draft'
                ? 'border-[#f90680] bg-white text-cs-black'
                : 'border-transparent text-cs-black hover:text-[#f90680]'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`font-black text-2xl md:text-[32px] uppercase px-8 py-4 tracking-[-0.05em] border-b-[8px] -mb-[4px] whitespace-nowrap transition-colors ${
              activeTab === 'past'
                ? 'border-[#f90680] bg-white text-cs-black'
                : 'border-transparent text-cs-black hover:text-[#f90680]'
            }`}
          >
            Past
          </button>
        </nav>

        {/* Rigid Folder Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px] w-full items-start">
          {/* Create New Vibe Card - Only show for upcoming tab */}
          {activeTab === 'upcoming' && (
            <Link href="/create" className="block w-full">
              <button className="border-4 border-cs-black bg-[#00FFFF] min-h-[320px] flex flex-col items-center justify-center gap-6 shadow-[8px_8px_0px_#000000] cursor-pointer w-full group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] transition-all focus:outline-none">
                <span className="material-symbols-outlined text-[88px] font-black group-hover:scale-110 transition-transform">add</span>
                <h3 className="text-[32px] font-black uppercase tracking-[-0.05em]">New Vibe</h3>
              </button>
            </Link>
          )}

          {trips.map((trip, idx) => {
            const cardColors = ['bg-cs-yellow', 'bg-cs-white', 'bg-cs-cyan', 'bg-primary'];
            const avatarColors = ['bg-cs-cyan', 'bg-primary', 'bg-cs-yellow', 'bg-cs-purple', 'bg-cs-white'];
            const bgClass = cardColors[idx % 4];
            const avatarClass = avatarColors[idx % 5];
            const textClass = bgClass === 'bg-primary' ? 'text-white' : 'text-cs-black';

            return (
              <div key={trip.id} className="relative">
                <Link href={`/trip/${trip.id}`} className="block w-full">
                  <article className={`${bgClass} border-4 border-cs-black shadow-[8px_8px_0px_#000000] flex flex-col cursor-pointer group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] transition-all min-h-[320px] overflow-hidden`}>
                    <div className="h-[200px] w-full border-b-4 border-cs-black overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={trip.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={trip.imageUrl}
                        style={{ filter: 'none', mixBlendMode: 'normal' }}
                      />
                      <div className={`absolute top-4 ${idx % 2 === 0 ? 'right-4' : 'left-4'} ${bgClass === 'bg-white' ? 'bg-cs-cyan' : 'bg-white'} border-4 border-cs-black px-3 py-1 text-sm font-bold uppercase`}>
                        {trip.days} DAYS
                      </div>
                    </div>
                    <div className={`p-6 flex flex-col flex-grow ${textClass}`}>
                      <h3 className="text-2xl lg:text-[28px] font-black uppercase mb-2 leading-tight tracking-[-0.05em]">{trip.title}</h3>
                      {trip.desc && <p className="font-semibold text-lg line-clamp-2 mb-4">{trip.desc}</p>}

                      <div className="mt-auto pt-4 flex items-center gap-4 border-t-4 border-cs-black">
                        <div className={`w-10 h-10 ${avatarClass} ${avatarClass === 'bg-primary' || avatarClass === 'bg-cs-purple' ? 'text-white' : 'text-cs-black'} border-4 border-cs-black rounded-none flex items-center justify-center font-display font-black text-lg`}>
                          {trip.curator?.handle?.substring(0, 2).toUpperCase() || 'XX'}
                        </div>
                        <span className="font-bold text-sm uppercase truncate">BY {trip.curator?.handle || trip.handle}</span>
                      </div>
                    </div>
                  </article>
                </Link>
                {activeTab === 'draft' && (
                  <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                    <Link
                      href={`/edit/${trip.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-3 bg-white border-4 border-black text-[#00FFFF] font-black uppercase text-sm hover:bg-gray-100 transition-colors flex items-center shadow-[4px_4px_0px_#000000]"
                      title="Edit trip"
                    >
                      <span className="material-symbols-outlined text-xl text-black">edit</span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteConfirm(trip.id);
                      }}
                      className="p-3 bg-white border-4 border-black text-[#f90680] font-black uppercase text-sm hover:bg-gray-100 transition-colors flex items-center shadow-[4px_4px_0px_#000000]"
                      title="Delete trip"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                )}
                {deleteConfirm === trip.id && (
                  <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(trip.id);
                      }}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-[#f90680] border-4 border-black text-white font-black uppercase text-xs hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? '...' : 'DELETE'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteConfirm(null);
                      }}
                      className="px-4 py-2 bg-white border-4 border-black text-black font-black uppercase text-xs hover:bg-gray-100 transition-colors"
                    >
                      CANCEL
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {trips.length === 0 && (
          <div className="w-full flex-1 flex items-center justify-center mt-20">
            <h2 className="font-black text-[48px] uppercase tracking-[-0.05em] text-center max-w-[800px] leading-tight">
                You have no trips. <br/><span className="text-[#f90680] bg-cs-black px-4 py-2 mt-4 inline-block border-4 border-cs-black">Go outside.</span>
            </h2>
          </div>
        )}
      </main>
    </div>
  );
}
