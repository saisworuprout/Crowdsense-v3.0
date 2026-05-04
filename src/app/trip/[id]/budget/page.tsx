'use client';

import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BudgetSplitPage() {
  const params = useParams();
  const tripId = params.id as string;

  return (
    <div className="bg-cs-yellow min-h-screen font-body text-cs-black pb-24 selection:bg-cs-black selection:text-[#f90680]">
      <Navbar />

      {/* Main Content Canvas */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        
        {/* Left Column: Spend vs Budget & Expenses */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Trip Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4">
            <div>
              <Link href={`/trip/${tripId}`} className="inline-flex items-center gap-2 bg-white border-4 border-cs-black px-4 py-2 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#000000] active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_#000000] transition-all mb-4">
                <span className="material-symbols-outlined text-cs-black font-bold">arrow_back</span>
                Back to Trip
              </Link>
              <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-2 mt-2">
                TOKYO <br/>DRIFT
              </h1>
              <p className="font-bold text-xl uppercase bg-white inline-block px-3 py-1 border-4 border-cs-black shadow-[4px_4px_0px_#000000]">
                Oct 12 - 24
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Friend 1" className="w-12 h-12 border-4 border-cs-black bg-white object-cover shadow-[4px_4px_0px_#000000]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzsIZbraPaccHaiNqBWyNmD68U1wg-F39CJIZ0a0Cwyy5irQ_vqOz2A0p_-5UNiq_THFN7O738ueuI4RgVwRcqxObVNo8o72OLlHOawuUMQ1GAPZ3N7ca5vIhF1FGhZegDOI1N2mlEXjyeJgMehx66mNE0J5r84egzo3HHoeeMnM_qxlwOfSWeGfk2hlrX8dY3WQ_S0XadkHIG6XK7PpXy2UIE39o5Szl0WTxTFwROqPfDuErvanCpSop5cdZtIx-ekLOs2j3Y_14" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Friend 2" className="w-12 h-12 border-4 border-cs-black bg-white object-cover shadow-[4px_4px_0px_#000000]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqniEfscHJigrmyJpw8NiRvgxpOpaKRnAV1jUz2CgtS2TRE4xHM2f-vmt_O7SZuRQAJPrmxHsVjT6vDO3PiqGgLSAnfR4ThoUP9pNHkja5FMtsV8XZmIppy6Z6TjPGJ1kjnxdn5QNneB1rYMUOy6lL4e-VnAOZa5fCepjppqY9M0SUcXtR7N47BtjUQu2jD979zwiCL0R9jxfusFzxMe2FiasXop0T5OFGjM_bxyc7R5mx5IOyr0hbnR1nHI8tXhRiMlRznSltzYo" />
              <div className="w-12 h-12 border-4 border-cs-black bg-cs-cyan flex items-center justify-center font-display font-black text-xl shadow-[4px_4px_0px_#000000]">
                +2
              </div>
            </div>
          </div>
          
          {/* Spend vs Budget Hero */}
          <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-8 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-[#f90680] rounded-full border-4 border-cs-black opacity-20"></div>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight">TOTAL SPEND</h2>
            <div className="flex items-end gap-4">
              <span className="font-display text-6xl md:text-8xl font-black leading-none tracking-tighter">$3,450</span>
              <span className="font-bold text-2xl text-cs-black/60 pb-2">/ $4,000</span>
            </div>
            
            {/* High Contrast Progress Bar */}
            <div className="w-full h-8 bg-gray-200 border-4 border-cs-black relative mt-4">
              <div className="absolute top-0 left-0 h-full bg-[#f90680] border-r-4 border-cs-black" style={{ width: '86%' }}></div>
            </div>
            <div className="flex justify-between font-bold uppercase text-sm mt-1">
              <span>86% USED</span>
              <span>$550 REMAINING</span>
            </div>
          </section>
          
          {/* Spend Categories */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Stay */}
            <div className="bg-cs-cyan border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-4 flex flex-col gap-2 transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] group cursor-pointer">
              <span className="material-symbols-outlined text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>bed</span>
              <h3 className="font-display font-black text-xl uppercase leading-tight">STAY</h3>
              <div className="font-bold text-2xl">$1,200</div>
              <div className="w-full h-3 bg-white border-4 border-cs-black mt-auto relative">
                <div className="absolute top-0 left-0 h-full bg-cs-black w-full"></div>
              </div>
            </div>
            
            {/* Travel */}
            <div className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-4 flex flex-col gap-2 transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] group cursor-pointer">
              <span className="material-symbols-outlined text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>flight_takeoff</span>
              <h3 className="font-display font-black text-xl uppercase leading-tight">FLIGHTS</h3>
              <div className="font-bold text-2xl">$950</div>
              <div className="w-full h-3 bg-gray-200 border-4 border-cs-black mt-auto relative">
                <div className="absolute top-0 left-0 h-full bg-cs-black w-full"></div>
              </div>
            </div>
            
            {/* Food */}
            <div className="bg-[#f90680] border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-4 flex flex-col gap-2 text-white transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] group cursor-pointer">
              <span className="material-symbols-outlined text-4xl mb-2 text-white" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              <h3 className="font-display font-black text-xl uppercase leading-tight border-b-4 border-cs-black pb-1 mb-1 text-white">FOOD</h3>
              <div className="font-bold text-2xl">$850</div>
              <div className="w-full h-3 bg-white border-4 border-cs-black mt-auto relative">
                <div className="absolute top-0 left-0 h-full bg-cs-yellow w-3/4 border-r-4 border-cs-black"></div>
              </div>
            </div>
            
            {/* Activities */}
            <div className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-4 flex flex-col gap-2 transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] group cursor-pointer">
              <span className="material-symbols-outlined text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>local_activity</span>
              <h3 className="font-display font-black text-xl uppercase leading-tight">FUN</h3>
              <div className="font-bold text-2xl">$450</div>
              <div className="w-full h-3 bg-gray-200 border-4 border-cs-black mt-auto relative">
                <div className="absolute top-0 left-0 h-full bg-cs-black w-1/2 border-r-4 border-cs-black"></div>
              </div>
            </div>

          </section>
        </div>
        
        {/* Right Column: Settle Up & AI Insights */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* AI Nudge */}
          <aside className="bg-white border-4 border-cs-cyan shadow-[8px_8px_0px_#00FFFF] p-6 relative">
            <div className="absolute -top-5 -right-5 bg-cs-black text-cs-yellow w-12 h-12 flex items-center justify-center rounded-full font-black text-2xl border-4 border-cs-cyan">
              !
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-cs-cyan text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              <h3 className="font-display font-black text-xl uppercase tracking-tighter">CROWD INTEL</h3>
            </div>
            <p className="font-bold text-lg leading-snug mb-4">
              You are spending <span className="bg-[#f90680] text-white px-1">40% more</span> on food than similar groups in Tokyo.
            </p>
            <button className="w-full py-3 bg-cs-black text-white font-display font-black uppercase tracking-tight hover:bg-cs-cyan hover:text-cs-black transition-colors border-4 border-cs-black shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] hover:-translate-y-1">
              SEE CHEAP EATS
            </button>
          </aside>
          
          {/* Settle Up Sidebar */}
          <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 flex flex-col gap-6">
            <h2 className="font-display text-3xl font-black uppercase tracking-tight bg-cs-yellow inline-block px-2 -ml-2 w-max border-4 border-cs-black">
              SETTLE UP
            </h2>
            <div className="flex flex-col gap-4">
              
              {/* Owe Item 1 */}
              <div className="flex items-center justify-between border-b-4 border-cs-black pb-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Alex" className="w-10 h-10 border-4 border-cs-black bg-gray-200 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKWdKseGiwxdSt4a-K8Ck9uq9sgm1vpoPb138K47aOB15u3I5k9MDluC-h3ttbJH1vhHv-orX3i-hFwQPmt5sjaFQtWd2NugW8q23yIo8i4d3l3vRWyovdLB4nobu1bDsIOuZEsGI7tBRnRRgvaMIcecKp5zrf0XRyVUxBRZLyVVTCOBUIf4nH6Fu5CsZPcOnV06QtXJTK-AnxEzItSRRDZJgUxPKY5lv85WyJUCe5teSN6f02RP1ZmG6ujm9QbK_v44QrdDetfiw" />
                  <div className="flex flex-col">
                    <span className="font-display font-black uppercase leading-none">ALEX</span>
                    <span className="text-sm font-bold text-cs-black/60">Owes You</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-black text-xl text-[#f90680] leading-none">$125.50</span>
                  <button className="bg-cs-cyan border-4 border-cs-black px-3 py-1 font-display font-black text-xs uppercase hover:bg-[#f90680] hover:text-white transition-colors shadow-[2px_2px_0px_#000000] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[4px_4px_0px_#000000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                    SETTLE
                  </button>
                </div>
              </div>
              
              {/* Owe Item 2 */}
              <div className="flex items-center justify-between border-b-4 border-cs-black pb-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Sarah" className="w-10 h-10 border-4 border-cs-black bg-gray-200 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCg5Jf9EwoXwi-Wh6nuKBVp65E5e6_QD0N-c4HEId6UKLWbK9iUJCu1uXxiURcntxPb-boQ0_WU6SAvoZr1L4xGd1MceL0e2Pmgj7WtXTwHOuwDKoJdtHQ1-JwWAy4F_R4qMW5vBSAWwjEjXgtZe7wiuXofE0abKj0UBF1q-LhmYGyl2OvpIqUhSZqiRainyXSZL15Pz1cEahUQPDcVig-DWcalGXhQ2ZYrT2AXza7CCqS0xwszlMFYLVJ0KIIlvz9HAobyw84z5y4" />
                  <div className="flex flex-col">
                    <span className="font-display font-black uppercase leading-none">SARAH</span>
                    <span className="text-sm font-bold text-cs-black/60">You Owe</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-black text-xl text-cs-black leading-none">$45.00</span>
                  <button className="bg-cs-black text-white border-4 border-cs-black px-3 py-1 font-display font-black text-xs uppercase hover:bg-[#f90680] transition-colors shadow-[2px_2px_0px_#000000] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[4px_4px_0px_#000000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                    PAY
                  </button>
                </div>
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-[#f90680] text-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] flex items-center justify-center hover:-translate-y-2 hover:shadow-[12px_16px_0px_#000000] active:translate-y-0 active:shadow-[4px_4px_0px_#000000] transition-all z-50 rounded-none cursor-pointer">
        <span className="material-symbols-outlined text-4xl font-black">add</span>
      </button>
    </div>
  );
}
