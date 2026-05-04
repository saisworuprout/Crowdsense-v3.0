'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

type Event = { id: string; time: string; name: string; note: string; };
type Day = { id: string; events: Event[] };

export default function EditTrip() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vibe, setVibe] = useState('Party');
  const [mission, setMission] = useState('');
  
  const [days, setDays] = useState<Day[]>([]);

  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrip() {
      if (!user) return;
      try {
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();
          
        if (tripError) throw tripError;
        
        if (tripData.user_id !== user.id) {
          throw new Error("You don't have permission to edit this trip.");
        }

        setDestination(tripData.destination || '');
        setStartDate(tripData.start_date || '');
        setEndDate(tripData.end_date || '');
        setVibe(tripData.vibe || 'Party');
        setMission(tripData.mission || '');

        const { data: daysData, error: daysError } = await supabase
          .from('itinerary_days')
          .select(`
            id,
            day_number,
            itinerary_events (
              id, time, title, description, type
            )
          `)
          .eq('trip_id', tripId)
          .order('day_number', { ascending: true });

        if (daysError) throw daysError;

        if (daysData && daysData.length > 0) {
          const loadedDays = daysData.map((d: any) => ({
            id: d.id,
            events: (d.itinerary_events || []).map((e: any) => ({
              id: e.id,
              time: e.time || '',
              name: e.title || '',
              note: e.description || ''
            }))
          }));
          setDays(loadedDays);
        } else {
          const numDays = tripData.duration_days || 1;
          const mockDays = Array.from({ length: numDays }, (_, i) => ({
            id: crypto.randomUUID(),
            events: [
              { id: crypto.randomUUID(), time: '10:00 AM', name: 'Local Market Exp.', note: 'Immersive exploration of the area and its best kept secrets.' },
              { id: crypto.randomUUID(), time: '02:00 PM', name: 'Historical District', note: 'Discover popular landmarks and architecture.' },
              { id: crypto.randomUUID(), time: '07:00 PM', name: 'Street Food Tour', note: 'Enjoy local cuisine and nightlife.' }
            ]
          }));
          setDays(mockDays);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to load trip details.');
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      if (user) {
        fetchTrip();
      } else {
        setIsLoading(false);
        setErrorMsg('You must be logged in to edit a trip.');
      }
    }
  }, [user, authLoading, tripId]);

  const addDay = () => {
    setDays([...days, { id: crypto.randomUUID(), events: [{ id: crypto.randomUUID(), time: '', name: '', note: '' }] }]);
  };

  const addEvent = (dayId: string) => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        return { ...d, events: [...d.events, { id: crypto.randomUUID(), time: '', name: '', note: '' }] };
      }
      return d;
    }));
  };

  const removeEvent = (dayId: string, eventId: string) => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        return { ...d, events: d.events.filter(e => e.id !== eventId) };
      }
      return d;
    }));
  };

  const updateEvent = (dayId: string, eventId: string, field: keyof Event, value: string) => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          events: d.events.map(e => e.id === eventId ? { ...e, [field]: value } : e)
        };
      }
      return d;
    }));
  };

  const saveChanges = async (status: 'draft' | 'upcoming', e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!destination && status === 'upcoming') {
      setErrorMsg('Destination is required to publish.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (status === 'draft') {
      setIsDraftSaving(true);
      setDraftMessage('');
    } else {
      setIsSubmitting(true);
      setErrorMsg('');
    }

    try {
      // 1. Update Trip
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          title: destination || 'Untitled Draft',
          destination: destination || '',
          start_date: startDate || null,
          end_date: endDate || null,
          vibe: vibe,
          mission: mission || null,
          status: status
        })
        .eq('id', tripId)
        .eq('user_id', user.id);
        
      if (tripError) throw new Error(tripError.message);

      // 2. Delete existing itinerary days (cascades to events)
      const { error: deleteError } = await supabase
        .from('itinerary_days')
        .delete()
        .eq('trip_id', tripId);
        
      if (deleteError) throw new Error(deleteError.message);

      // 3. Re-insert Itinerary Days and Events
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        
        const { data: dayData, error: dayError } = await supabase
          .from('itinerary_days')
          .insert({
            trip_id: tripId,
            day_number: i + 1
          })
          .select()
          .single();
          
        if (dayError) throw new Error(dayError.message);
        
        const dayIdDB = dayData.id;
        
        if (day.events.length > 0) {
          const eventsToInsert = day.events.map(ev => ({
            day_id: dayIdDB,
            time: ev.time || null,
            title: ev.name || 'Untitled Event',
            description: ev.note || null,
            type: 'activity'
          }));
          
          const { error: eventError } = await supabase
            .from('itinerary_events')
            .insert(eventsToInsert);
            
          if (eventError) throw new Error(eventError.message);
        }
      }

      if (status === 'upcoming') {
        setShowSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          router.push('/my-trips');
        }, 3000);
      } else {
        setDraftMessage('Draft updated! You can find it in My Trips.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
    } catch (err: any) {
      console.error(err);
      if (status === 'draft') {
        setDraftMessage(err.message || 'Failed to update draft.');
      } else {
        setErrorMsg(err.message || 'Failed to update trip. Please try again.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsDraftSaving(false);
      setIsSubmitting(false);
    }
  };

  const totalEvents = days.reduce((acc, day) => acc + day.events.length, 0);

  if (isLoading || authLoading) {
    return (
      <div className="bg-[#f8f5f7] min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 w-full flex items-center justify-center">
           <div className="text-4xl font-black uppercase">Loading Trip...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f5f7] text-cs-black antialiased min-h-screen flex flex-col selection:bg-cs-black selection:text-[#f90680]">
      <Navbar />

      <main className="w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-16 pb-32 mt-8 relative">
        
        {showSuccess && (
          <div className="bg-[#00FF00] border-4 border-cs-black p-6 flex flex-col md:flex-row items-center gap-4 shadow-[8px_8px_0px_#000000] absolute top-[-20px] left-4 right-4 z-20">
            <span className="material-symbols-outlined text-cs-black text-5xl">task_alt</span>
            <div>
              <h3 className="font-black text-2xl uppercase leading-none">NOISE PUBLISHED SUCCESSFULLY!</h3>
              <p className="font-bold text-lg">Your legendary itinerary is now live on the grid.</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-[#f90680] text-white border-4 border-cs-black p-6 flex flex-col md:flex-row items-center gap-4 shadow-[8px_8px_0px_#000000] absolute top-[-20px] left-4 right-4 z-20">
            <span className="material-symbols-outlined text-white text-5xl">warning</span>
            <div>
              <h3 className="font-black text-2xl uppercase leading-none">SYSTEM ERROR</h3>
              <p className="font-bold text-lg">{errorMsg}</p>
            </div>
          </div>
        )}

        {draftMessage && (
          <div className={`border-4 border-cs-black p-6 flex flex-col md:flex-row items-center gap-4 shadow-[8px_8px_0px_#000000] absolute top-[-20px] left-4 right-4 z-20 ${
            draftMessage.includes('Failed') || draftMessage.includes('must be') ? 'bg-[#f90680] text-white' : 'bg-[#00FF00] text-cs-black'
          }`}>
            <span className="material-symbols-outlined text-5xl">{draftMessage.includes('Failed') || draftMessage.includes('must be') ? 'warning' : 'task_alt'}</span>
            <div>
              <h3 className="font-black text-2xl uppercase leading-none">{draftMessage.includes('Failed') || draftMessage.includes('must be') ? 'ERROR' : 'DRAFT SAVED'}</h3>
              <p className="font-bold text-lg">{draftMessage}</p>
            </div>
          </div>
        )}

        <div className="relative items-center flex flex-col md:flex-row justify-between border-b-4 border-cs-black pb-8">
          <div className="absolute -top-4 left-0 bg-[#00FFFF] text-cs-black px-3 py-1 font-black uppercase text-xl border-4 border-cs-black rotate-[-2deg] shadow-[4px_4px_0px_#000000]">
            Edit Mode
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-cs-black drop-shadow-[4px_4px_0px_#f90680] mt-4 md:mt-0 leading-[0.85]">
            TWEAK THE<br/>NOISE
          </h1>
          <span className="material-symbols-outlined text-[80px] hidden md:block" style={{ fontVariationSettings: "'FILL' 1" }}>edit_square</span>
        </div>

        <form className="flex flex-col gap-16">
          
          {/* STEP 01: DESTINATION */}
          <section className="border-4 border-cs-black p-6 md:p-10 shadow-[8px_8px_0px_#000000] bg-white relative">
            <div className="absolute -top-6 left-4 md:left-8 bg-cs-black text-white px-4 py-2 text-2xl font-black uppercase shadow-[4px_4px_0px_#f90680] rotate-[-1deg]">
              Step 01 — Destination
            </div>
            
            <div className="mt-6 flex flex-col gap-8">
              {/* Location */}
              <label className="flex flex-col gap-3 font-black uppercase text-xl">
                Where to?
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="border-4 border-cs-black p-4 text-2xl font-bold font-body placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_#f90680] transition-shadow shadow-[4px_4px_0px_#000000]" 
                  placeholder="e.g. Neo Tokyo, Japan" 
                />
              </label>
              
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <label className="flex flex-col gap-3 font-black uppercase text-xl">
                  Start Date
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-4 border-cs-black p-4 text-xl font-bold font-body focus:outline-none focus:shadow-[4px_4px_0px_#00FFFF] transition-shadow shadow-[4px_4px_0px_#000000]" 
                  />
                </label>
                <label className="flex flex-col gap-3 font-black uppercase text-xl">
                  End Date
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-4 border-cs-black p-4 text-xl font-bold font-body focus:outline-none focus:shadow-[4px_4px_0px_#00FFFF] transition-shadow shadow-[4px_4px_0px_#000000]" 
                  />
                </label>
              </div>

              {/* Vibe Selector */}
              <div>
                <span className="font-black uppercase text-xl block mb-3">Trip Vibe</span>
                <div className="flex flex-wrap gap-4">
                  {['Luxury', 'Party', 'Backpacker', 'Chill / Relax', 'Culture & Art'].map(v => (
                    <label key={v} className="cursor-pointer relative group">
                      <input 
                        type="radio" 
                        name="vibe" 
                        value={v} 
                        checked={vibe === v}
                        onChange={() => setVibe(v)}
                        className="peer sr-only" 
                      />
                      <div className="border-4 border-cs-black bg-white px-6 py-3 text-lg font-black uppercase peer-checked:bg-[#f90680] peer-checked:text-white shadow-[4px_4px_0px_#000000] group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0px_#000000] transition-all">
                        {v}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <label className="flex flex-col gap-3 font-black uppercase text-xl">
                Trip Mission (Optional)
                <textarea 
                  rows={3} 
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  className="border-4 border-cs-black p-4 text-xl font-bold font-body placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_#FFD700] transition-shadow shadow-[4px_4px_0px_#000000] min-h-[120px]" 
                  placeholder="What makes this trip legendary?"
                ></textarea>
              </label>
            </div>
          </section>

          {/* STEP 02: ITINERARY BUILDER */}
          <section className="border-4 border-cs-black p-6 md:p-10 shadow-[8px_8px_0px_#000000] bg-[#f8f5f7] relative mt-4">
            <div className="absolute -top-6 left-4 md:left-8 bg-cs-black text-white px-4 py-2 text-2xl font-black uppercase shadow-[4px_4px_0px_theme(colors.cs-yellow)] rotate-[1deg]">
              Step 02 — Build Itinerary
            </div>
            
            <div className="mt-8 flex flex-col gap-12">
              {days.map((day, dIdx) => (
                <div key={day.id} className="flex flex-col gap-6 relative border-l-8 border-cs-black pl-4 md:pl-8">
                  <div className="flex justify-between items-center bg-cs-black text-white p-4 border-4 border-cs-black shadow-[4px_4px_0px_#f90680] w-fit rotate-[-1deg]">
                    <h3 className="text-3xl font-black uppercase">Day 0{dIdx + 1}</h3>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    {day.events.map((ev) => (
                      <div key={ev.id} className="flex flex-col md:flex-row gap-4 items-start border-4 border-cs-black bg-white p-4 relative group">
                        <button 
                          type="button" 
                          onClick={() => removeEvent(day.id, ev.id)}
                          className="absolute -right-4 -top-4 bg-[#f90680] text-white border-4 border-cs-black rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-[2px_2px_0px_#000000] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm font-black">close</span>
                        </button>
                        <input 
                          type="time" 
                          value={ev.time}
                          onChange={(e) => updateEvent(day.id, ev.id, 'time', e.target.value)}
                          className="w-full md:w-32 border-4 border-cs-black p-2 font-black text-lg focus:outline-none focus:bg-[#00FFFF]" 
                        />
                        <div className="flex flex-col gap-2 flex-grow w-full">
                          <input 
                            type="text" 
                            placeholder="Activity / Place Name" 
                            value={ev.name}
                            onChange={(e) => updateEvent(day.id, ev.id, 'name', e.target.value)}
                            className="w-full border-4 border-cs-black font-black text-xl p-2 focus:outline-none focus:bg-[#FFD700]" 
                          />
                          <input 
                            type="text" 
                            placeholder="Optional notes... (e.g. Try the matcha)" 
                            value={ev.note}
                            onChange={(e) => updateEvent(day.id, ev.id, 'note', e.target.value)}
                            className="w-full border-b-2 border-cs-black font-bold text-md p-1 focus:outline-none focus:border-b-4" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={() => addEvent(day.id)}
                    className="self-start border-4 border-cs-black bg-white px-4 py-2 font-black uppercase hover:bg-[#00FFFF] shadow-[4px_4px_0px_#000000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000000] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm font-black">add</span> Event
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              type="button" 
              onClick={addDay}
              className="mt-12 border-4 border-cs-black bg-[#FFD700] font-black text-2xl p-6 uppercase shadow-[8px_8px_0px_#000000] hover:-translate-y-1 hover:shadow-[12px_12px_0px_#000000] active:translate-y-0 active:shadow-[4px_4px_0px_#000000] flex items-center justify-center gap-3 w-full transition-all group cursor-pointer"
            >
              <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform font-black">add_circle</span> 
              ADD ANOTHER DAY
            </button>
          </section>

          {/* STEP 03: REVIEW & SAVE */}
          <section className="border-4 border-cs-black p-6 md:p-10 shadow-[8px_8px_0px_#000000] bg-white relative mt-4">
            <div className="absolute -top-6 left-4 md:left-8 bg-cs-black text-white px-4 py-2 text-2xl font-black uppercase shadow-[4px_4px_0px_theme(colors.cs-cyan)] rotate-[-1deg]">
              Step 03 — Review & Save
            </div>

            <div className="mt-8 flex flex-col items-center gap-6 justify-center w-full">
              <button 
                type="button" 
                onClick={() => setShowPreview(true)}
                className="border-2 border-cs-black bg-cs-black text-white px-6 py-3 font-black text-xl uppercase hover:bg-[#00FFFF] hover:text-cs-black transition-colors w-full md:w-auto cursor-pointer"
              >
                Regenerate Summary Preview
              </button>

              {showPreview && (
                <div className="w-full border-4 border-cs-black bg-[#f8f5f7] p-6 shadow-[4px_4px_0px_#000000] text-left flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2 text-sm font-black uppercase">
                    <span className="bg-[#f90680] text-white border-2 border-cs-black px-2 py-1">{vibe || 'ANY'}</span>
                    <span className="bg-white border-2 border-cs-black px-2 py-1">{(startDate && endDate) ? `${startDate} to ${endDate}` : 'DATES TBD'}</span>
                  </div>
                  <h2 className="text-4xl font-black uppercase break-words">{destination || 'MYSTERY DESTINATION'}</h2>
                  <div className="border-t-4 border-cs-black pt-4 mt-2 font-bold uppercase">
                    {days.length} Days • {totalEvents} Events
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-6 justify-center w-full mt-6">
                <button
                  type="button"
                  onClick={(e) => saveChanges('draft', e)}
                  disabled={isDraftSaving}
                  className="w-full sm:w-1/2 border-4 border-cs-black bg-white px-8 py-6 font-black text-2xl uppercase shadow-[8px_8px_0px_#000000] hover:-translate-y-1 hover:shadow-[12px_12px_0px_#000000] hover:bg-[#00FFFF] active:translate-y-0 active:shadow-[4px_4px_0px_#000000] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDraftSaving ? 'SAVING...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={(e) => saveChanges('upcoming', e)}
                  disabled={isSubmitting}
                  className="w-full sm:w-1/2 border-4 border-cs-black bg-[#f90680] text-white px-8 py-6 font-black text-2xl uppercase shadow-[8px_8px_0px_#000000] hover:-translate-y-1 hover:shadow-[12px_12px_0px_#000000] active:translate-y-0 active:shadow-[4px_4px_0px_#000000] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'PUBLISHING...' : 'Publish Now'}
                </button>
              </div>
            </div>
          </section>

        </form>
      </main>
    </div>
  );
}
