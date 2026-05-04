'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useBudget } from '@/components/providers/BudgetProvider';

export default function BudgetTripSelection() {
  const { user } = useAuth();
  const router = useRouter();
  const { setTrip } = useBudget();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrips() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setTrips(data);
      }
      setLoading(false);
    }
    fetchTrips();
  }, [user]);

  const handleTripSelect = (trip: any) => {
    setTrip({
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      duration_days: trip.duration_days || 1,
    });
    router.push('/budget/setup');
  };

  return (
    <div className="bg-cs-yellow min-h-screen font-body text-cs-black pb-24 selection:bg-cs-black selection:text-[#f90680]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-8 relative">
        <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8 bg-white border-4 border-cs-black inline-block p-4 shadow-[8px_8px_0px_#000000] rotate-[-1deg]">
          SELECT A TRIP
        </h1>

        {loading ? (
          <div className="font-black text-2xl uppercase animate-pulse">Loading Trips...</div>
        ) : trips.length === 0 ? (
          <div className="bg-white border-4 border-cs-black p-8 shadow-[8px_8px_0px_#000000] max-w-xl">
            <h3 className="font-black text-2xl uppercase mb-4">No trips found</h3>
            <p className="font-bold text-lg mb-6">Create a trip first to start tracking your budget!</p>
            <button onClick={() => router.push('/create')} className="bg-[#f90680] text-white font-black uppercase px-6 py-3 border-4 border-cs-black shadow-[4px_4px_0px_#000000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000000] transition-all">
              Create Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map(trip => (
              <div 
                key={trip.id} 
                onClick={() => handleTripSelect(trip)}
                className="bg-white border-4 border-cs-black p-6 shadow-[8px_8px_0px_#000000] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_#000000] transition-all cursor-pointer brutal-interactive flex flex-col gap-4"
              >
                {trip.image_url ? (
                  <div className="w-full h-40 border-4 border-cs-black overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={trip.image_url} alt={trip.title} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div className="w-full h-40 border-4 border-cs-black bg-cs-cyan flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl">flight_takeoff</span>
                  </div>
                )}
                
                <div>
                  <h2 className="font-display font-black text-2xl uppercase tracking-tight">{trip.title}</h2>
                  <p className="font-bold text-cs-black/70 text-lg uppercase">{trip.destination}</p>
                </div>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t-4 border-cs-black">
                  <span className="font-bold">{trip.duration_days} Days</span>
                  <button className="bg-cs-yellow border-4 border-cs-black px-4 py-2 font-black uppercase text-sm shadow-[2px_2px_0px_#000000]">
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
