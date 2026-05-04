'use client';

import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useState } from 'react';

import { allTrips } from '@/lib/data';

const cardColors = ['bg-cs-yellow', 'bg-cs-white', 'bg-cs-cyan', 'bg-primary'];
const avatarColors = ['bg-cs-cyan', 'bg-primary', 'bg-cs-yellow', 'bg-cs-purple', 'bg-cs-white'];

const VIBES = ['Luxury', 'Party', 'Foodie', 'Backpacker', 'Chill / Relax', 'Culture & Art'];
export default function Discover() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [durationVal, setDurationVal] = useState(14);
  const [budgetVal, setBudgetVal] = useState(5000);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string>('moderate');

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  const toggleDuration = (duration: string) => {
    setSelectedDuration(prev => prev === duration ? null : duration);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 6, filteredTrips.length));
  };

  const filteredTrips = allTrips.filter(trip => {
    // Vibe filter - if any selected, trip must match one
    if (selectedVibes.length > 0 && !selectedVibes.includes(trip.vibe || '')) {
      return false;
    }

    // Duration filter
    if (selectedDuration === 'Weekend (1-3 d)' && (trip.days < 1 || trip.days > 3)) return false;
    if (selectedDuration === '1 Week' && (trip.days < 4 || trip.days > 7)) return false;
    if (selectedDuration === '2+ Weeks' && trip.days < 14) return false;

    // Budget filter (mock - in real app would use actual trip cost)
    if (selectedBudget === 'budget' && trip.days > 3) return false;
    if (selectedBudget === 'luxury' && trip.days < 7) return false;

    return true;
  });

  return (
    <>
      <Navbar />
      <main className="flex flex-1 w-full max-w-[1600px] mx-auto bg-cs-white">
        {/* Overlay */}
        <div 
          className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 cursor-pointer ${isFilterOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}
          onClick={() => setIsFilterOpen(false)}
        ></div>

        {/* Sidebar Filters */}
        <aside 
          className={`fixed top-0 right-0 h-full w-full sm:w-[400px] border-l-4 border-cs-black bg-white p-8 z-[70] transform transition-transform duration-300 overflow-y-auto shadow-[-12px_12px_0px_#000000] ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-cs-black text-4xl font-black leading-tight uppercase font-display">FILTER VIBES</h2>
            <button 
              onClick={() => setIsFilterOpen(false)}
              className="size-10 border-4 border-cs-black bg-cs-white flex items-center justify-center hover:bg-cs-yellow shadow-[4px_4px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#000000] transition-all rounded-none cursor-pointer"
            >
              <span className="material-symbols-outlined font-black">close</span>
            </button>
          </div>
          
          <div className="space-y-8">
            {/* Filter Group 1: Vibe */}
            <div>
              <h3 className="text-xl font-bold bg-cs-black text-cs-white px-2 py-1 inline-block mb-4 uppercase font-display">VIBE</h3>
              <div className="flex flex-col gap-4">
                {VIBES.map(vibe => (
                  <label key={vibe} className="brutal-checkbox cursor-pointer flex items-center gap-4 group">
                    <input
                      type="checkbox"
                      checked={selectedVibes.includes(vibe)}
                      onChange={() => toggleVibe(vibe)}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 border-4 border-cs-black shadow-[4px_4px_0px_#000000] group-hover:shadow-[6px_6px_0px_#000000] group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 transition-all flex items-center justify-center ${selectedVibes.includes(vibe) ? 'bg-[#f90680]' : 'bg-white'}`}>
                      {selectedVibes.includes(vibe) && (
                        <svg className="w-5 h-5 text-white font-black" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="square" strokeLinejoin="miter"></path>
                        </svg>
                      )}
                    </div>
                    <span className="font-display font-bold text-xl uppercase text-cs-black">{vibe}</span>
                  </label>
                ))}
                <button className="flex items-center gap-2 mt-2 font-display font-bold text-lg uppercase hover:text-[var(--color-primary)] transition-colors cursor-pointer group w-fit border-4 border-transparent hover:border-cs-black p-1 -ml-1 text-cs-black">
                  <span className="material-symbols-outlined font-black group-hover:translate-y-1 transition-transform">expand_more</span>
                  More Vibes
                </button>
              </div>
            </div>

            <hr className="border-t-4 border-cs-black my-2" />

            {/* Filter Group 2: Duration */}
            <div>
              <h3 className="text-xl font-bold bg-cs-cyan border-4 border-cs-black px-2 py-1 inline-block mb-4 shadow-[4px_4px_0px_#000000] uppercase font-display text-cs-black">DURATION</h3>
              <div className="flex flex-col gap-4">
                {['Weekend (1-3 d)', '1 Week', '2+ Weeks'].map(duration => (
                  <label key={duration} className="brutal-checkbox cursor-pointer flex items-center gap-4 group">
                    <input
                      type="checkbox"
                      checked={selectedDuration === duration}
                      onChange={() => toggleDuration(duration)}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 border-4 border-cs-black shadow-[4px_4px_0px_#000000] group-hover:shadow-[6px_6px_0px_#000000] group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 transition-all flex items-center justify-center ${selectedDuration === duration ? 'bg-[#f90680]' : 'bg-white'}`}>
                      {selectedDuration === duration && (
                        <svg className="w-5 h-5 text-white font-black" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="square" strokeLinejoin="miter"></path>
                        </svg>
                      )}
                    </div>
                    <span className="font-display font-bold text-xl uppercase text-cs-black">{duration}</span>
                  </label>
                ))}

                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex justify-between font-display font-bold text-lg uppercase items-center text-cs-black">
                    <span>Exact Length:</span>
                    <span className="bg-cs-black text-white px-2 py-1 shadow-[2px_2px_0px_rgba(249,6,128,1)]">{durationVal} Days</span>
                  </div>
                  <input
                    type="range" min="3" max="30" value={durationVal}
                    onChange={(e) => setDurationVal(Number(e.target.value))}
                    className="w-full bg-cs-white border-4 border-cs-black brutal-slider mt-2"
                  />
                </div>
              </div>
            </div>

            <hr className="border-t-4 border-cs-black my-2" />

            {/* Filter Group 3: Budget */}
            <div>
              <h3 className="text-xl font-bold bg-cs-yellow border-4 border-cs-black px-2 py-1 inline-block mb-4 shadow-[4px_4px_0px_#000000] uppercase font-display text-cs-black">BUDGET</h3>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer group">
                  <input type="radio" name="budget_tier" className="sr-only peer" value="budget" checked={selectedBudget === 'budget'} onChange={(e) => setSelectedBudget(e.target.value)} />
                  <div className="h-full bg-white text-cs-black border-4 border-cs-black p-2 font-display font-bold text-lg shadow-[4px_4px_0px_#000000] text-center peer-checked:bg-[#f90680] peer-checked:text-white group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_#000000] transition-all">
                    $20
                  </div>
                </label>
                <label className="flex-1 cursor-pointer group">
                  <input type="radio" name="budget_tier" className="sr-only peer" value="moderate" checked={selectedBudget === 'moderate'} onChange={(e) => setSelectedBudget(e.target.value)} />
                  <div className="h-full bg-white text-cs-black border-4 border-cs-black p-2 font-display font-bold text-lg shadow-[4px_4px_0px_#000000] text-center peer-checked:bg-[#f90680] peer-checked:text-white group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_#000000] transition-all">
                    $500
                  </div>
                </label>
                <label className="flex-1 cursor-pointer group">
                  <input type="radio" name="budget_tier" className="sr-only peer" value="luxury" checked={selectedBudget === 'luxury'} onChange={(e) => setSelectedBudget(e.target.value)} />
                  <div className="h-full bg-white text-cs-black border-4 border-cs-black p-2 font-display font-bold text-lg shadow-[4px_4px_0px_#000000] text-center peer-checked:bg-[#f90680] peer-checked:text-white group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_#000000] transition-all">
                    $5000
                  </div>
                </label>
              </div>

              <div className="mt-8 flex flex-col gap-2">
                <div className="flex justify-between font-display font-bold text-lg uppercase items-center text-cs-black">
                  <span>Range limit:</span>
                  <span className="bg-cs-black text-white px-2 py-1 shadow-[2px_2px_0px_rgba(249,6,128,1)]">${budgetVal}</span>
                </div>
                <input 
                  type="range" min="20" max="50000" value={budgetVal}
                  onChange={(e) => setBudgetVal(Number(e.target.value))}
                  className="w-full bg-cs-white border-4 border-cs-black brutal-slider mt-2"
                />
              </div>
            </div>
            
            <hr className="border-t-4 border-cs-black my-8" />
            
            <button 
              className="w-full bg-[#f90680] text-white border-4 border-cs-black text-2xl font-black uppercase py-4 mt-8 shadow-[6px_6px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_#000000] transition-all focus:outline-none"
              onClick={() => setIsFilterOpen(false)}
            >
              APPLY FILTERS
            </button>
          </div>
        </aside>

        {/* Content */}
        <section className="w-full p-4 md:p-8 bg-[#f8f5f7]">
          <div className="flex justify-between items-end mb-8 border-b-4 border-cs-black pb-4">
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-cs-black font-display">
              EXPLORE TRIPS
            </h1>
            <div className="flex items-center gap-4">
              <span className="font-display font-bold text-xl bg-cs-cyan px-3 py-1 border-4 border-cs-black hidden md:block uppercase text-cs-black">{filteredTrips.length} Found</span>
              <div className="relative group">
                <Link href="/create" className="flex items-center justify-center bg-cs-yellow border-4 border-cs-black h-[46px] w-[46px] shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_#000000] transition-all cursor-pointer text-cs-black">
                  <span className="material-symbols-outlined font-black text-2xl group-hover:rotate-90 transition-transform duration-300">add</span>
                </Link>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-3 py-1 bg-cs-black text-white font-display font-bold text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-[4px_4px_0px_theme(colors.primary)] border-2 border-cs-white z-50">
                  Make your own noise
                </div>
              </div>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 bg-cs-white text-cs-black border-4 border-cs-black px-4 py-2 font-display font-black text-lg uppercase shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_#000000] transition-all group cursor-pointer"
              >
                <span className="material-symbols-outlined font-black group-hover:rotate-180 transition-transform duration-300">tune</span>
                Filter
              </button>
            </div>
          </div>

          {/* Grid Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredTrips.slice(0, visibleCount).map((trip, idx) => {
              const bgClass = cardColors[idx % 4];
              const avatarClass = avatarColors[idx % 5];

              let textClass = 'text-cs-black';
              if (bgClass === 'bg-primary') textClass = 'text-white';

              return (
                <Link href={`/trip/${trip.id}`} key={trip.id} className="block w-full">
                  <article className={`${bgClass} border-4 border-cs-black shadow-brutal brutal-interactive flex flex-col min-h-[400px] cursor-pointer`}>
                    <div className="h-48 border-b-4 border-cs-black relative overflow-hidden bg-cs-black">
                      <div className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${trip.imageUrl}')` }}>
                      </div>
                      <div className={`absolute top-4 left-4 ${bgClass === 'bg-white' ? 'bg-cs-cyan' : 'bg-cs-white'} ${bgClass === 'bg-white' ? 'text-cs-black' : 'text-cs-black'} border-4 border-cs-black px-3 py-1 font-display font-black text-sm uppercase`}>
                        {trip.days} Days
                      </div>
                      {trip.isHot && (
                         <div className="absolute top-4 right-4 bg-[#f90680] text-white border-4 border-cs-black px-2 py-1 font-display font-black text-sm uppercase flex items-center gap-1 shadow-[2px_2px_0px_#000000]">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span> Hot
                         </div>
                      )}
                    </div>
                    <div className={`p-6 flex flex-col flex-grow justify-between ${textClass}`}>
                      <div>
                        <h3 className="text-3xl font-black leading-tight mb-2 font-display uppercase">{trip.title}</h3>
                        <p className="font-body font-semibold text-lg line-clamp-2">{trip.desc}</p>
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t-4 border-cs-black pt-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${avatarClass} ${avatarClass === 'bg-primary' || avatarClass === 'bg-cs-purple' ? 'text-white' : 'text-cs-black'} border-2 border-cs-black rounded-none flex items-center justify-center font-display font-black text-lg`}>
                            {trip.avatarInit}
                          </div>
                          <span className="font-display font-bold text-sm uppercase">{trip.handle}</span>
                        </div>
                        <button className="bg-cs-white text-cs-black border-4 border-cs-black w-10 h-10 flex items-center justify-center hover:bg-[#f90680] hover:text-white transition-colors cursor-pointer">
                          <span className="material-symbols-outlined font-black">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          {visibleCount < filteredTrips.length && (
            <div className="mt-20 flex justify-center">
              <button 
                onClick={handleLoadMore}
                className="bg-cs-white border-4 border-cs-black text-cs-black text-xl font-black uppercase px-10 py-5 shadow-[8px_8px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] hover:bg-cs-yellow transition-all flex items-center gap-3 cursor-pointer"
              >
                LOAD MORE NOISE
                <span className="material-symbols-outlined font-black">autorenew</span>
              </button>
            </div>
          )}
        </section>

      </main>
    </>
  );
}
