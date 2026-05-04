'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

interface ReplanData {
  removed: string[];
  added: string[];
  shifted: string[];
}

interface Message {
  id: number;
  text: string;
  isAI: boolean;
  isError?: boolean;
  replanData?: ReplanData;
}

export default function MeetEva() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "HELLO. I AM EVA. SELECT A TRIP TO BEGIN, AND IF YOU EXPERIENCE ANY DISRUPTIONS, I WILL REPLAN IT INSTANTLY.",
      isAI: true
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trips state
  const [draftTrips, setDraftTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

  // Itinerary state
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [removedItems, setRemovedItems] = useState<string[]>([]);
  const [addedItems, setAddedItems] = useState<string[]>([]);
  const [shiftedNotes, setShiftedNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchDrafts() {
      if (!user) {
        setLoadingTrips(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setDraftTrips(data);
      }
      setLoadingTrips(false);
    }
    
    fetchDrafts();
  }, [user]);

  const loadTripItinerary = async (trip: any) => {
    setSelectedTrip(trip);
    setRemovedItems([]);
    setAddedItems([]);
    setShiftedNotes({});
    
    // Fetch days
    const { data: daysData } = await supabase
      .from('itinerary_days')
      .select('id, day_number')
      .eq('trip_id', trip.id)
      .order('day_number', { ascending: true });
      
    if (!daysData || daysData.length === 0) {
      // Fallback to a mock itinerary if the database has no events (like trip-detail page does)
      const mockDaysCount = trip.duration_days || 3;
      const mockItinerary: any[] = [];
      
      for (let i = 1; i <= mockDaysCount; i++) {
        mockItinerary.push(
          { id: `mock-${i}-1`, day: i, time: '10:00 AM', name: 'Local Market Exp.', desc: 'Immersive exploration of the area and its best kept secrets.', tag: 'activity', icon: 'local_activity' },
          { id: `mock-${i}-2`, day: i, time: '02:00 PM', name: 'Historical District', desc: 'Discover popular landmarks and architecture.', tag: 'travel', icon: 'flight' },
          { id: `mock-${i}-3`, day: i, time: '07:00 PM', name: 'Street Food Tour', desc: 'Enjoy local cuisine and nightlife.', tag: 'dining', icon: 'restaurant' }
        );
      }
      
      setItinerary(mockItinerary);
      setMessages(prev => [...prev, { id: Date.now(), text: `I'VE LOADED "${trip.title}". IT HAS NO SAVED EVENTS, SO I GENERATED A MOCK ITINERARY FOR YOU TO PLAY WITH!`, isAI: true }]);
      return;
    }
    
    const dayIds = daysData.map(d => d.id);
    
    // Fetch events
    const { data: eventsData } = await supabase
      .from('itinerary_events')
      .select('*')
      .in('day_id', dayIds)
      .order('time', { ascending: true });
      
    const formattedItinerary = (eventsData || []).map(ev => {
      const dayInfo = daysData.find(d => d.id === ev.day_id);
      return {
        id: ev.id,
        day: dayInfo?.day_number || 1,
        time: ev.time || 'TBA',
        name: ev.title,
        desc: ev.description || '',
        tag: ev.type || 'Event',
        icon: ev.type === 'travel' ? 'flight' : ev.type === 'stay' ? 'hotel' : ev.type === 'dining' ? 'restaurant' : 'local_activity'
      };
    });
    
    // Sort roughly by day
    formattedItinerary.sort((a, b) => a.day - b.day);
    
    setItinerary(formattedItinerary);
    setMessages(prev => [...prev, { id: Date.now(), text: `YOUR ITINERARY FOR "${trip.title}" IS LOADED. IF YOU EXPERIENCE ANY DISRUPTIONS, LET ME KNOW.`, isAI: true }]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    if (!selectedTrip) {
      setMessages(prev => [...prev, { id: Date.now(), text: inputValue, isAI: false }]);
      setInputValue('');
      setMessages(prev => [...prev, { id: Date.now(), text: "PLEASE SELECT A DRAFT TRIP FROM THE LEFT PANEL FIRST.", isAI: true, isError: true }]);
      return;
    }

    const userMessage = inputValue;
    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, isAI: false }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, itinerary })
      });

      if (!res.ok) {
        let errMsg = "Couldn't reach replanning engine, try again";
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch(e) {}
        
        setMessages(prev => [...prev, { id: Date.now(), text: errMsg, isAI: true, isError: true }]);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      
      // Add success message with replan card
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: data.message || "I HAVE GENERATED A NEW PLAN BASED ON YOUR DISRUPTION. PLEASE REVIEW:", 
        isAI: true,
        replanData: data
      }]);

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now(), text: "Received an unexpected response", isAI: true, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyReplan = (replan: ReplanData) => {
    let updatedItinerary = [...itinerary];
    
    // Create items for added array
    const newItems = replan.added.map((name, i) => ({
      id: `added-${Date.now()}-${i}`,
      day: 1, 
      time: 'TBA',
      name,
      desc: 'Added by Eva based on new conditions',
      tag: 'Replan',
      icon: 'new_releases'
    }));
    
    updatedItinerary = [...updatedItinerary, ...newItems];
    
    setRemovedItems(replan.removed);
    setAddedItems(newItems.map(i => i.id));
    
    const newShiftedNotes: Record<string, string> = {};
    replan.shifted.forEach(shiftStr => {
      const match = updatedItinerary.find(item => shiftStr.toLowerCase().includes(item.name.toLowerCase()));
      if (match) {
        newShiftedNotes[match.id] = shiftStr;
      }
    });
    setShiftedNotes(newShiftedNotes);
    
    setItinerary(updatedItinerary);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-body" style={{ backgroundColor: '#FFD700' }}>
      <Navbar />

      <main className="flex-grow flex flex-col md:flex-row w-full overflow-hidden" style={{height: 'calc(100vh - 80px)'}}>
        
        {/* Left Panel: Itinerary Timeline */}
        <aside className="w-full md:w-[45%] p-6 md:p-12 overflow-y-auto border-r-4 border-black bg-[#FFD700]">
          {!selectedTrip ? (
            <div className="flex flex-col gap-8 h-full items-center pt-12">
              <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter shadow-[4px_4px_0px_black] bg-white text-black border-4 border-black inline-block px-6 py-3 rotate-[-2deg] text-center">
                Select A Draft Trip
              </h2>
              
              {loadingTrips ? (
                <div className="font-black text-2xl uppercase mt-8 animate-pulse text-black">
                  Loading Trips...
                </div>
              ) : draftTrips.length === 0 ? (
                <div className="mt-8 text-center bg-white border-4 border-black shadow-[8px_8px_0px_black] p-8 max-w-[400px]">
                  <h3 className="font-black text-3xl uppercase mb-4 text-[#FF007F]">No Trips Found!</h3>
                  <p className="font-bold text-lg leading-relaxed">
                    You have no saved trips in your drafts. Go to <span className="bg-black text-white px-2">Discover</span> or <span className="bg-[#00FFFF] text-black px-2 border-2 border-black">New Vibe</span> to start planning one.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full max-w-[400px] mt-4">
                  {draftTrips.map(trip => (
                    <button 
                      key={trip.id}
                      onClick={() => loadTripItinerary(trip)}
                      className="bg-white border-4 border-black shadow-[8px_8px_0px_black] p-6 text-left flex flex-col gap-2 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_black] transition-all"
                    >
                      <h3 className="font-black text-2xl uppercase tracking-tight">{trip.title}</h3>
                      <p className="font-bold text-black/70 line-clamp-1">{trip.destination}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 mb-8">
                <button 
                  onClick={() => setSelectedTrip(null)} 
                  className="self-start bg-white border-4 border-black shadow-[4px_4px_0px_black] font-black uppercase px-4 py-2 text-sm hover:bg-[#00FFFF] transition-colors"
                >
                  &larr; BACK TO TRIPS
                </button>
                <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter shadow-[4px_4px_0px_black] bg-white text-black border-4 border-black inline-block px-6 py-3 rotate-[-2deg] self-start">
                  {selectedTrip.title}
                </h2>
              </div>
              
              <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_black] mb-8 flex flex-col gap-3">
                {selectedTrip.destination && (
                  <p className="font-bold text-lg"><span className="text-[#FF007F] font-black uppercase">Dest:</span> {selectedTrip.destination}</p>
                )}
                {selectedTrip.vibe && (
                  <p className="font-bold text-lg"><span className="text-[#00FFFF] font-black uppercase text-black bg-black px-1 mr-1">VIBE</span> {selectedTrip.vibe}</p>
                )}
                {selectedTrip.duration_days && (
                  <p className="font-bold text-lg"><span className="font-black uppercase border-b-2 border-black">Days:</span> {selectedTrip.duration_days}</p>
                )}
                {selectedTrip.mission && (
                  <div className="mt-2 border-t-4 border-black pt-2">
                     <p className="font-bold text-base text-gray-800 italic">&quot;{selectedTrip.mission}&quot;</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-8">
                {itinerary.length === 0 ? (
                  <div className="p-8 border-4 border-black bg-white shadow-[8px_8px_0px_black] text-center">
                    <h3 className="font-black text-2xl uppercase mb-2">No Events Yet!</h3>
                    <p className="font-bold">This trip doesn&apos;t have an itinerary. Eva can still assist you with general planning for this destination.</p>
                  </div>
                ) : (
                  itinerary.map(item => {
                    const isRemoved = removedItems.some(r => r.toLowerCase() === item.name.toLowerCase());
                    const isAdded = addedItems.includes(item.id);
                    const shiftedStr = shiftedNotes[item.id];
                    
                    return (
                      <div key={item.id} className={`p-6 border-4 border-black shadow-[8px_8px_0px_black] transition-all flex flex-col gap-3 ${isAdded ? 'bg-[#00FFFF]' : 'bg-white'} ${isRemoved ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex justify-between items-start gap-4">
                           <h3 className={`text-2xl md:text-3xl font-black uppercase font-display tracking-tight leading-none ${isRemoved ? 'line-through text-gray-500' : 'text-black'}`}>
                             {item.name}
                           </h3>
                           <span className="material-symbols-outlined text-3xl flex-shrink-0 bg-black text-white p-2 rounded-full shadow-[2px_2px_0px_white]">{item.icon}</span>
                        </div>
                        
                        {shiftedStr ? (
                          <p className="font-black text-sm md:text-base uppercase bg-[#FF007F] text-white p-2 border-2 border-black inline-block self-start shadow-[2px_2px_0px_black]">
                            {shiftedStr}
                          </p>
                        ) : (
                          <p className={`font-black text-sm md:text-base uppercase bg-black text-white p-2 border-2 border-black inline-block self-start shadow-[2px_2px_0px_white] ${isRemoved ? 'line-through' : ''}`}>
                            Day {item.day} • {item.time}
                          </p>
                        )}
                        
                        {item.desc && <p className="text-lg font-bold text-black/80">{item.desc}</p>}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </aside>

        {/* Right Panel: Chat Container */}
        <section className="w-full md:w-[55%] p-4 md:p-8 flex flex-col h-full bg-white relative">
          {/* Brutalist Pattern Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
          
          <div className="w-full h-full max-w-[800px] mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col relative z-10">
            {/* Chat Header */}
            <div className="bg-[#FF007F] text-white p-5 border-b-4 border-black flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>face_4</span>
                <h1 className="font-black text-3xl uppercase tracking-tighter leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>MEET EVA</h1>
              </div>
              <div className="flex items-center gap-2 bg-white text-[#FF007F] px-3 py-1 font-black text-sm tracking-widest border-2 border-black shadow-[2px_2px_0px_black]">
                <div className="w-3 h-3 bg-[#00FFFF] animate-pulse border-2 border-black"></div>
                LIVE
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow p-6 overflow-y-auto flex flex-col gap-6 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 w-full max-w-[90%] ${msg.isAI ? '' : 'self-end justify-end'}`}>
                  {msg.isAI ? (
                    <div className="flex flex-col gap-2 max-w-full">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-[#FF007F] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <span className="material-symbols-outlined text-white text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>face_4</span>
                        </div>
                        <div className={`${msg.isError ? 'bg-red-500' : 'bg-[#FF007F]'} text-white p-4 md:p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                          <p className="font-bold text-base md:text-lg leading-relaxed uppercase" style={{ fontFamily: 'Archivo, sans-serif' }}>
                            {msg.text}
                          </p>
                        </div>
                      </div>
                      
                      {/* Replan Card UI */}
                      {msg.replanData && 
                        ((msg.replanData.removed && msg.replanData.removed.length > 0) || 
                         (msg.replanData.added && msg.replanData.added.length > 0) || 
                         (msg.replanData.shifted && msg.replanData.shifted.length > 0)) && (
                        <div className="mt-2 ml-16 p-5 border-4 border-black bg-white text-black shadow-[4px_4px_0px_black] brutal-interactive">
                          <h4 className="font-black text-2xl uppercase mb-4 border-b-4 border-black pb-2 font-display">Suggested Replan</h4>
                          
                          {msg.replanData.removed && msg.replanData.removed.length > 0 && (
                            <div className="mb-4">
                              <h5 className="font-black text-[#FF007F] uppercase mb-2 bg-black px-2 py-1 inline-block text-sm border-2 border-[#FF007F]">Removed</h5>
                              <ul className="list-none flex flex-col gap-2">
                                {msg.replanData.removed.map(i => (
                                  <li key={i} className="font-bold text-lg border-l-4 border-black pl-3 bg-gray-100 p-1 line-through decoration-2 decoration-[#FF007F]">{i}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {msg.replanData.added && msg.replanData.added.length > 0 && (
                            <div className="mb-4">
                              <h5 className="font-black text-black uppercase mb-2 bg-[#00FFFF] px-2 py-1 inline-block text-sm border-2 border-black">Added</h5>
                              <ul className="list-none flex flex-col gap-2">
                                {msg.replanData.added.map(i => (
                                  <li key={i} className="font-bold text-lg border-l-4 border-[#00FFFF] pl-3 bg-gray-100 p-1">{i}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {msg.replanData.shifted && msg.replanData.shifted.length > 0 && (
                            <div className="mb-6">
                              <h5 className="font-black text-white uppercase mb-2 bg-black px-2 py-1 inline-block text-sm border-2 border-black">Shifted</h5>
                              <ul className="list-none flex flex-col gap-2">
                                {msg.replanData.shifted.map(i => (
                                  <li key={i} className="font-bold text-lg border-l-4 border-[#FFD700] pl-3 bg-gray-100 p-1">{i}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => handleApplyReplan(msg.replanData!)}
                            className="w-full bg-[#00FFFF] border-4 border-black font-black text-xl uppercase py-3 shadow-[4px_4px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_black] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all"
                            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                          >
                            APPLY REPLAN
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#00FFFF] text-black p-4 md:p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-right">
                      <p className="font-bold text-base md:text-lg leading-relaxed uppercase" style={{ fontFamily: 'Archivo, sans-serif' }}>
                        {msg.text}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex gap-4 w-full max-w-[90%]">
                    <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-[#FF007F] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <span className="material-symbols-outlined text-white text-2xl md:text-3xl animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>autorenew</span>
                    </div>
                    <div className="bg-white text-black p-4 md:p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center">
                      <p className="font-black text-base md:text-lg uppercase animate-pulse">
                        EVA IS PROCESSING...
                      </p>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-5 border-t-4 border-black bg-white flex flex-col gap-4 shrink-0">
              
              {/* Quick Triggers */}
              <div className="flex gap-3 flex-wrap">
                {['Flight Delayed', 'Bad Weather', 'Hotel Issue'].map(trigger => (
                  <button 
                    key={trigger}
                    onClick={() => setInputValue(trigger)}
                    className="text-xs md:text-sm font-black uppercase border-2 border-black px-3 py-2 bg-[#FFD700] hover:bg-black hover:text-[#FFD700] transition-colors shadow-[2px_2px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {trigger}
                  </button>
                ))}
              </div>

              <div className="relative flex-grow flex gap-4">
                <div className="relative flex-grow">
                  <input
                    className="w-full h-full border-4 border-black bg-white p-3 md:p-4 pl-10 md:pl-12 font-black text-base md:text-xl placeholder:text-black/40 focus:border-[#FF007F] focus:ring-0 focus:outline-none transition-colors"
                    placeholder="ASK THE NOISE..."
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  />
                  <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-black text-xl md:text-2xl">mic</span>
                </div>
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="bg-[#FF007F] disabled:bg-gray-400 text-white px-4 md:px-8 py-3 md:py-4 border-4 border-black font-black text-lg md:text-xl uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 flex items-center gap-2 shrink-0"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  <span className="hidden md:inline">SEND</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}