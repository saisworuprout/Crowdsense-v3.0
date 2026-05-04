import Link from 'next/link';
import { getTripById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Trip, ItineraryDay, ItineraryEvent } from '@/lib/types';
import { CloneButton } from '@/components/ui/CloneButton';
import { supabase } from '@/lib/supabaseClient';

async function getTripData(id: string) {
  // First check if it's a UUID (Supabase trip) or string (mock trip)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (isUUID) {
    // Try to fetch from Supabase
    const { data: trip } = await supabase
      .from('trips')
      .select(`
        *,
        itinerary_days (
          id,
          day_number,
          created_at
        ),
        profiles (
          handle,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (trip) {
      // Fetch itinerary events for each day
      const daysWithEvents = await Promise.all(
        (trip.itinerary_days || []).map(async (day: any) => {
          const { data: events } = await supabase
            .from('itinerary_events')
            .select('*')
            .eq('day_id', day.id)
            .order('created_at', { ascending: true });

          return {
            dayNumber: day.day_number,
            events: events || []
          };
        })
      );

      return {
        id: trip.id,
        title: trip.title,
        desc: trip.mission || trip.vibe,
        days: trip.duration_days || daysWithEvents.length || 1,
        handle: trip.curator_handle || trip.profiles?.handle || 'Unknown',
        vibe: trip.vibe,
        imageUrl: trip.image_url || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=2000',
        avatarInit: trip.curator_initials || trip.curator_handle?.substring(0, 2).toUpperCase(),
        itinerary: daysWithEvents.length > 0 ? daysWithEvents : undefined,
        curator: {
          handle: trip.curator_handle || trip.profiles?.handle || 'Unknown',
          avatar: trip.curator_avatar || trip.profiles?.avatar_url || ''
        }
      } as Trip;
    }
  }

  // Fall back to mock data
  return getTripById(id);
}

export default async function TripDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await getTripData(id);

  if (!trip) {
    notFound();
  }

  // Mock a full itinerary if not provided in the data.ts
  const itinerary = trip.itinerary || Array.from({ length: trip.days }, (_, i) => ({
    dayNumber: i + 1,
    events: [
      { id: '1', time: '10:00 AM', title: 'Local Market Exp.', location: '', description: 'Immersive exploration of the area and its best kept secrets.', type: 'activity' },
      { id: '2', time: '02:00 PM', title: 'Historical District', location: '', description: 'Discover popular landmarks and architecture.', type: 'travel' },
      { id: '3', time: '07:00 PM', title: 'Street Food Tour', location: '', description: 'Enjoy local cuisine and nightlife.', type: 'dining' }
    ]
  } as ItineraryDay));

  const getEventStyle = (index: number) => {
    if (index === 1) return { bg: 'bg-[#f90680] text-white', tagBg: 'bg-white text-black' };
    if (index === 2) return { bg: 'bg-black text-white', tagBg: 'bg-[#f90680] text-white border-white' };
    return { bg: 'bg-white', tagBg: 'bg-black text-white' };
  };

  const getEventIcon = (type?: string) => {
    switch (type) {
      case 'dining': return 'local_dining';
      case 'stay': return 'hotel';
      case 'travel': return 'directions_walk';
      default: return 'location_on';
    }
  };

  return (
    <div className="bg-white text-black min-h-screen flex flex-col md:flex-row overflow-hidden selection:bg-black selection:text-[#f90680]">
      {/* LEFT PANEL: Sticky Summary (40%) */}
      <aside className="w-full md:w-[40%] md:h-screen md:sticky top-0 bg-[#f90680] border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col justify-between p-8 md:p-12 relative z-20 group">
        {/* Background Texture/Image Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-20 bg-cover bg-center" 
          style={{ backgroundImage: `url('${trip.imageUrl}')` }}
        />
        
        {/* Top Action: Back */}
        <div className="relative z-10 flex justify-start">
          <Link href="/discover" className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_black] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_black] active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_black] transition-all">
            <span className="material-symbols-outlined text-black font-bold">arrow_back</span>
            Discover
          </Link>
        </div>

        {/* Main Content: Title & Meta */}
        <div className="relative z-10 flex flex-col gap-6 mt-12 md:mt-0">
          <div className="inline-flex flex-col items-start gap-4">
            <div className="bg-black text-white px-4 py-1 font-bold tracking-widest uppercase border-4 border-black -rotate-2 shadow-[4px_4px_0px_white]">
              Curated Vibe
            </div>
            <h1 className="text-6xl md:text-[80px] leading-[0.85] font-black uppercase tracking-tighter text-white drop-shadow-[6px_6px_0px_black] break-words hyphens-auto">
              {trip.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="w-16 h-16 rounded-full border-4 border-black overflow-hidden shadow-[4px_4px_0px_black] bg-white flex items-center justify-center font-black text-2xl text-black">
              {trip.curator.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Creator Avatar" className="w-full h-full object-cover" src={trip.curator.avatar} />
              ) : (
                <span>{trip.curator.handle.substring(1, 3).toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black text-lg drop-shadow-[2px_2px_0px_black] uppercase">{trip.curator.handle}</span>
              <span className="text-black font-bold text-sm bg-white px-2 py-0.5 border-2 border-black inline-block self-start shadow-[2px_2px_0px_black] uppercase">
                {trip.days} Days • {Math.floor(trip.days * 2.5)} Spots
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Action: Clone */}
        <div className="relative z-10 mt-12 md:mt-0">
          <CloneButton tripId={trip.id} />
        </div>
      </aside>

      {/* RIGHT PANEL: Scrolling Timeline (60%) */}
      <main className="w-full md:w-[60%] bg-white h-screen overflow-y-auto relative z-10 p-6 md:p-16 lg:p-24 relative">
        {/* Brutalist Background Grid Pattern */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
        
        <div className="max-w-3xl mx-auto flex flex-col gap-24 relative z-10 pb-32">
          {itinerary.map((day, dIndex) => {
            const isEven = day.dayNumber % 2 === 0;
            const rotateClass = isEven ? 'rotate-[1deg]' : '-rotate-[1deg]';
            const dFormatted = day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber;

            return (
              <section key={day.dayNumber} className={`flex flex-col gap-12 relative ${dIndex > 0 ? 'mt-8' : ''}`}>
                {/* Timeline vertical connector */}
                <div className="absolute left-6 md:left-[108px] top-20 bottom-[-96px] w-2 bg-black border-r-2 border-white z-0 hidden md:block"></div>
                
                {/* Day Header */}
                <div className="sticky top-6 z-30 self-start">
                  <h2 className={`bg-black text-white text-5xl font-black uppercase py-4 px-8 border-4 border-black shadow-[8px_8px_0px_#f90680] inline-block ${rotateClass} hover:rotate-0 transition-transform`}>
                    Day {dFormatted}
                  </h2>
                </div>

                {/* Day Events */}
                {day.events.map((ev, eIndex) => {
                  const style = getEventStyle(eIndex);
                  
                  return (
                    <article key={ev.id} className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-8 items-start group">
                      <div className="w-full md:w-28 flex-shrink-0 md:pt-6 text-2xl font-black uppercase bg-white md:text-right px-2 py-1 md:p-0 border-b-4 md:border-b-0 border-black inline-block">
                        {ev.time}
                      </div>

                      <div className={`flex-grow w-full ${style.bg} border-4 border-black p-6 shadow-[8px_8px_0px_black] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_black] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 cursor-pointer`}>
                        <div className="flex flex-col gap-3">
                          <h3 className={`text-3xl font-black uppercase leading-none ${style.bg.includes('black') ? 'text-[#f90680]' : ''}`}>
                            {ev.title}
                          </h3>
                          <p className="text-lg font-bold text-gray-800 bg-white p-2 border-l-4 border-black">
                            {ev.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className={`text-xs font-black uppercase border-2 border-black px-2 py-1 rounded-sm ${style.tagBg}`}>
                              {ev.type}
                            </span>
                            <span className={`text-xs font-black uppercase border-2 border-black px-2 py-1 rounded-sm ${style.bg.includes('black') ? 'text-white border-white' : ''}`}>
                              {ev.location || '2-3 Hours'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white text-black border-4 border-black p-4 shadow-[4px_4px_0px_black] rounded-full flex-shrink-0 group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-3xl">{getEventIcon(ev.type)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            );
          })}

          {/* End of Itinerary Marker */}
          <div className="flex justify-center mt-12 relative z-10">
            <div className="w-4 h-4 bg-black rounded-full border-4 border-white shadow-[0px_0px_0px_4px_black]"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
