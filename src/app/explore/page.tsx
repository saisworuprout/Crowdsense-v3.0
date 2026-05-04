'use client';

import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

export default function Explore() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFD700' }}>
      <Navbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-16 flex flex-col gap-24">
        {/* Hero Section */}
        <section className="flex flex-col items-start gap-8 w-full">
          <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl leading-none uppercase tracking-tighter text-black w-full text-left" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            TOOLKIT FOR<br />THE NOISE
          </h1>
          <p className="font-body text-xl md:text-2xl max-w-3xl leading-relaxed text-black/80 border-l-8 border-[#FF007F] pl-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Break free from boring, static travel tools. CrowdSense is your high-voltage command center for dynamic, real-time exploration. Navigate the chaos, together.
          </p>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 w-full">
          {/* Card 1 - CrowdSense Alerts */}
          <Link href="/alerts" className="block">
            <button className="w-full text-left bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 relative group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
              <div className="absolute -top-6 -right-6 bg-[#FF007F] text-white font-black text-lg px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-3 uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                LIVE
              </div>
              <div className="w-16 h-16 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: '#FFD700' }}>
                <span className="material-symbols-outlined text-3xl explore-icon-motion explore-icon-flame" style={{ fontVariationSettings: "'FILL' 1", color: '#FF007F' }}>local_fire_department</span>
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight text-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>CrowdSense™ Alerts</h3>
                <p className="text-lg leading-relaxed text-black/80" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Real-time density heatmaps. Know exactly where the crowds are before you get stuck in them. Avoid the traps, find the pulse.
                </p>
              </div>
            </button>
          </Link>

          {/* Card 2 - Collaborative Planning */}
          <Link href="/collaborative-planning" className="block">
            <button className="w-full text-left border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 relative group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200" style={{ backgroundColor: '#00FFFF' }}>
              <div className="w-16 h-16 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: 'white' }}>
                <span className="material-symbols-outlined text-3xl text-black explore-icon-motion explore-icon-bob">how_to_vote</span>
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight text-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Collaborative Planning</h3>
                <p className="text-lg leading-relaxed text-black/90" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Stop arguing in group chats. Propose hotels, vote on activities, and finalize the itinerary in a single, high-impact workspace.
                </p>
              </div>
            </button>
          </Link>

          {/* Card 3 - Meet Eva */}
          <Link href="/meet-eva" className="block">
            <button className="w-full text-left border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 text-white relative group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200" style={{ backgroundColor: '#FF007F' }}>
              <div className="w-16 h-16 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: 'white' }}>
                <span className="material-symbols-outlined text-3xl text-black explore-icon-motion explore-icon-spark" style={{ fontVariationSettings: "'FILL' 1" }}>face_4</span>
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Meet Eva</h3>
                <p className="text-lg leading-relaxed text-white/90" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Flight delayed? Rain poured? Our AI instantly reshuffles your schedule based on live conditions. Never waste a minute.
                </p>
              </div>
            </button>
          </Link>

          {/* Card 4 - Budget & Split */}
          <Link href="/budget" className="block">
            <button className="w-full text-left bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 relative group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
              <div className="w-16 h-16 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: '#00FFFF' }}>
                <span className="material-symbols-outlined text-3xl text-black explore-icon-motion explore-icon-tilt">payments</span>
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight text-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Budget & Split</h3>
                <p className="text-lg leading-relaxed text-black/80" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Live budget tracking and merciless bill splitting. Know exactly who owes what, instantly. No more awkward math at dinner.
                </p>
              </div>
            </button>
          </Link>

          {/* Card 5 - Visa & Docs */}
          <Link href="/visa-docs" className="block">
            <button className="w-full text-left border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 relative group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200" style={{ backgroundColor: '#FFD700' }}>
              <div className="w-16 h-16 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: 'white' }}>
                <span className="material-symbols-outlined text-3xl text-black explore-icon-motion explore-icon-pop">fact_check</span>
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight text-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Visa & Docs</h3>
                <p className="text-lg leading-relaxed text-black/80" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Auto-generated checklists based on your nationality and destination. Do not let paperwork derail your adventure.
                </p>
              </div>
            </button>
          </Link>

          {/* Card 6 - Offline Mode */}
          <Link href="#" className="block">
            <button className="w-full text-left bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 relative group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
              <div className="w-16 h-16 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: '#FF007F' }}>
                <span className="material-symbols-outlined text-3xl text-white explore-icon-motion explore-icon-pulse">wifi_off</span>
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight text-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Offline Mode</h3>
                <p className="text-lg leading-relaxed text-black/80" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Total access without the internet. Your maps, tickets, and plans are locked in and available when the signal drops.
                </p>
              </div>
            </button>
          </Link>

          {/* Card 7 - Find Crew */}
          <Link href="/find-crew" className="block">
            <button className="w-full text-left border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 relative group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 text-white" style={{ backgroundColor: '#1A1A2E' }}>
              <div className="absolute -top-6 -right-6 bg-[#00FFFF] text-black font-black text-lg px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-3 uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                NEW
              </div>
              <div className="w-16 h-16 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: '#00FFFF' }}>
                <span className="material-symbols-outlined text-3xl text-black explore-icon-motion explore-icon-bob" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Find Crew</h3>
                <p className="text-lg leading-relaxed text-white/80" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Connect with fellow travelers via UID. Search people, build your crew, and chat in real-time. No trip is better than the people you share it with.
                </p>
              </div>
            </button>
          </Link>
        </section>

        {/* CTA Section */}
        <section className="w-full flex justify-center pb-24 pt-12">
          <Link href="/discover">
            <button className="text-white font-black text-3xl md:text-5xl uppercase tracking-tighter px-12 py-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]" style={{ fontFamily: 'Space Grotesk, sans-serif', background: 'linear-gradient(to bottom, #FF007F, #9f004d)' }}>
              START PLANNING
            </button>
          </Link>
        </section>
      </main>
    </div>
  );
}
