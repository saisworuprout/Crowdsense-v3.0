'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';
import { useBudget, CategoryAllocation } from '@/components/providers/BudgetProvider';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_CATEGORIES = ['Stay', 'Flights', 'Food', 'Fun', 'Other'];

export default function BudgetSplit() {
  const router = useRouter();
  const { state, setCategoryAllocations } = useBudget();
  
  const [mode, setMode] = useState<'MANUAL' | 'EVA'>('MANUAL');
  const [allocations, setAllocations] = useState<CategoryAllocation[]>([]);
  const [evaStyle, setEvaStyle] = useState<'BUDGET' | 'BALANCED' | 'COMFORT'>('BALANCED');
  const [evaLoading, setEvaLoading] = useState(false);
  const [evaReasoning, setEvaReasoning] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!state.selectedTrip || state.totalBudget <= 0) {
      router.push('/budget/setup');
      return;
    }
    
    // Initialize allocations evenly
    if (allocations.length === 0) {
      const baseShare = Math.floor(state.totalBudget / DEFAULT_CATEGORIES.length);
      const init = DEFAULT_CATEGORIES.map(name => ({
        name,
        amount: baseShare,
        percentage: Number(((baseShare / state.totalBudget) * 100).toFixed(1))
      }));
      setAllocations(init);
    }
  }, [state.selectedTrip, state.totalBudget, router]);

  if (!state.selectedTrip) return null;

  const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.amount), 0);
  const unallocated = state.totalBudget - totalAllocated;
  const isOverBudget = unallocated < 0;
  const isPerfect = Math.abs(unallocated) < 1; // allow small floating point diffs

  const updateAllocation = (index: number, field: 'amount' | 'percentage', value: number) => {
    const updated = [...allocations];
    let newAmount = updated[index].amount;
    let newPercent = updated[index].percentage;

    if (field === 'amount') {
      newAmount = value;
      newPercent = Number(((value / state.totalBudget) * 100).toFixed(1));
    } else {
      newPercent = value;
      newAmount = Number(((value / 100) * state.totalBudget).toFixed(0));
    }

    updated[index] = { ...updated[index], amount: newAmount, percentage: newPercent };
    setAllocations(updated);
  };

  const addCategory = () => {
    setAllocations([...allocations, { name: 'New Category', amount: 0, percentage: 0 }]);
  };

  const removeCategory = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleEvaCall = async () => {
    setEvaLoading(true);
    try {
      const res = await fetch('/api/budget-eva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: state.selectedTrip?.destination,
          duration: state.selectedTrip?.duration_days,
          members: state.activeMembers.length,
          style: evaStyle,
          budget: state.totalBudget
        })
      });

      if (!res.ok) throw new Error("Failed to fetch Eva's plan");
      
      const data = await res.json();
      
      const newAllocations: CategoryAllocation[] = [];
      const newReasoning: Record<string, string> = {};
      
      Object.keys(data).forEach(key => {
        newAllocations.push({
          name: key,
          amount: data[key].amount,
          percentage: data[key].percentage
        });
        if (data[key].reasoning) {
          newReasoning[key] = data[key].reasoning;
        }
      });
      
      setAllocations(newAllocations);
      setEvaReasoning(newReasoning);
      
    } catch (err) {
      alert("Eva couldn't process this right now. Try again.");
    } finally {
      setEvaLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!isPerfect) return;
    
    // Save to DB
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .upsert({
        trip_id: state.selectedTrip.id,
        total_amount: state.totalBudget,
        currency: state.currency,
        active_members: state.activeMembers,
        upfront_payments: state.upfrontPayments,
      }, { onConflict: 'trip_id' })
      .select()
      .single();

    if (budgetData) {
      // Clear old categories if updating
      await supabase.from('budget_categories').delete().eq('budget_id', budgetData.id);
      
      const categoryInserts = allocations.map(a => ({
        budget_id: budgetData.id,
        name: a.name,
        allocated_amount: a.amount,
        percentage: a.percentage
      }));
      await supabase.from('budget_categories').insert(categoryInserts);
    }

    setCategoryAllocations(allocations);
    router.push(`/budget/tracker?tripId=${state.selectedTrip.id}`);
  };

  return (
    <div className="bg-cs-yellow min-h-screen font-body text-cs-black pb-24 selection:bg-cs-black selection:text-[#f90680]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-8 relative">
        <button onClick={() => router.back()} className="font-bold text-lg uppercase flex items-center gap-2 hover:translate-x-1 transition-transform self-start">
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none bg-white border-4 border-cs-black inline-block p-4 shadow-[8px_8px_0px_#000000] rotate-[-1deg]">
            SPLIT BUDGET
          </h1>

          <div className="flex bg-white border-4 border-cs-black shadow-[4px_4px_0px_#000000]">
            <button 
              onClick={() => setMode('MANUAL')}
              className={`px-6 py-3 font-black uppercase text-lg transition-colors ${mode === 'MANUAL' ? 'bg-cs-black text-white' : 'hover:bg-gray-100'}`}
            >
              MANUAL
            </button>
            <button 
              onClick={() => setMode('EVA')}
              className={`px-6 py-3 font-black uppercase text-lg flex items-center gap-2 transition-colors ${mode === 'EVA' ? 'bg-[#f90680] text-white' : 'hover:bg-[#f90680]/20'}`}
            >
              <span className="material-symbols-outlined text-xl">smart_toy</span>
              EVA MODE
            </button>
          </div>
        </div>

        {/* Live Budget Bar */}
        <div className="bg-white border-4 border-cs-black p-6 shadow-[8px_8px_0px_#000000] sticky top-[100px] z-10">
          <div className="flex justify-between items-end mb-2">
            <span className="font-display font-black text-2xl uppercase">Allocated</span>
            <span className="font-black text-3xl">
              {state.currency} {totalAllocated.toLocaleString()} <span className="text-xl text-gray-500">/ {state.totalBudget.toLocaleString()}</span>
            </span>
          </div>
          <div className="w-full h-8 bg-gray-200 border-4 border-cs-black relative">
            <div 
              className={`absolute top-0 left-0 h-full border-r-4 border-cs-black transition-all ${isOverBudget ? 'bg-red-500' : 'bg-cs-cyan'}`} 
              style={{ width: `${Math.min((totalAllocated / state.totalBudget) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 font-bold uppercase text-sm">
            <span className={`${isOverBudget ? 'text-red-500 font-black' : ''}`}>
              {isOverBudget ? `${state.currency} ${Math.abs(unallocated).toLocaleString()} OVER BUDGET` : `${state.currency} ${unallocated.toLocaleString()} UNALLOCATED`}
            </span>
            <span className={isPerfect ? 'text-green-600 font-black' : ''}>
              {isPerfect ? 'PERFECT SPLIT' : ''}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        {mode === 'MANUAL' ? (
          <div className="flex flex-col gap-4">
            {allocations.map((alloc, i) => (
              <div key={i} className="bg-white border-4 border-cs-black p-4 shadow-[4px_4px_0px_#000000] flex flex-col md:flex-row gap-4 items-center">
                <input 
                  type="text" 
                  value={alloc.name} 
                  onChange={(e) => {
                    const up = [...allocations];
                    up[i].name = e.target.value;
                    setAllocations(up);
                  }}
                  className="font-display font-black text-2xl uppercase w-full md:w-1/3 outline-none bg-transparent border-b-4 border-transparent focus:border-cs-black"
                />
                
                <div className="flex gap-2 w-full md:w-2/3 items-center">
                  <div className="relative flex-grow">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black">{state.currency}</span>
                    <input 
                      type="number" 
                      value={alloc.amount || ''}
                      onChange={(e) => updateAllocation(i, 'amount', Number(e.target.value))}
                      className="w-full border-4 border-cs-black p-3 pl-12 font-black text-xl outline-none"
                    />
                  </div>
                  <span className="font-black text-2xl">=</span>
                  <div className="relative w-24 shrink-0">
                    <input 
                      type="number" 
                      value={alloc.percentage || ''}
                      onChange={(e) => updateAllocation(i, 'percentage', Number(e.target.value))}
                      className="w-full border-4 border-cs-black p-3 pr-8 font-black text-xl outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black">%</span>
                  </div>
                  <button onClick={() => removeCategory(i)} className="text-gray-400 hover:text-red-500 ml-2">
                    <span className="material-symbols-outlined text-3xl">delete</span>
                  </button>
                </div>
                
                {evaReasoning[alloc.name] && (
                  <div className="w-full text-sm font-bold bg-[#00FFFF]/20 border-l-4 border-cs-cyan p-2 mt-2 md:mt-0 md:col-span-full">
                    Eva: {evaReasoning[alloc.name]}
                  </div>
                )}
              </div>
            ))}

            <button 
              onClick={addCategory}
              className="bg-gray-100 border-4 border-cs-black border-dashed py-4 font-black text-xl uppercase hover:bg-gray-200 transition-colors"
            >
              + ADD CATEGORY
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 bg-white border-4 border-[#f90680] shadow-[8px_8px_0px_#f90680] p-8">
            <h2 className="font-display font-black text-3xl uppercase">How do you travel?</h2>
            <div className="flex flex-col md:flex-row gap-4">
              {['BUDGET', 'BALANCED', 'COMFORT'].map(style => (
                <button
                  key={style}
                  onClick={() => setEvaStyle(style as any)}
                  className={`flex-1 py-4 border-4 border-cs-black font-black text-xl uppercase transition-all shadow-[4px_4px_0px_#000000] ${evaStyle === style ? 'bg-cs-black text-white translate-y-[2px] translate-x-[2px] shadow-none' : 'bg-white hover:bg-gray-100'}`}
                >
                  {style}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleEvaCall}
              disabled={evaLoading}
              className="w-full bg-[#f90680] text-white py-4 border-4 border-cs-black font-display font-black text-2xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-[8px_8px_0px_#000000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[6px_6px_0px_#000000] active:translate-y-[8px] active:translate-x-[8px] active:shadow-none transition-all disabled:bg-gray-400"
            >
              {evaLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">autorenew</span>
                  PROCESSING...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  ASK EVA TO SPLIT IT
                </>
              )}
            </button>

            {Object.keys(evaReasoning).length > 0 && (
              <div className="mt-8 flex flex-col gap-4">
                <h3 className="font-black text-xl uppercase">Eva's Suggestions:</h3>
                {allocations.map((alloc, i) => (
                  <div key={i} className="border-4 border-cs-black p-4 bg-gray-50 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-display font-black text-xl uppercase">{alloc.name}</span>
                      <span className="font-black text-lg">{alloc.percentage}% • {state.currency} {alloc.amount.toLocaleString()}</span>
                    </div>
                    {evaReasoning[alloc.name] && (
                      <p className="font-bold text-sm text-[#f90680]">{evaReasoning[alloc.name]}</p>
                    )}
                  </div>
                ))}
                <p className="font-bold text-sm text-center mt-2">Switch back to MANUAL MODE to fine-tune these numbers.</p>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={handleConfirm}
          disabled={!isPerfect}
          className={`mt-8 py-4 font-display font-black text-2xl uppercase tracking-widest border-4 border-cs-black transition-all w-full ${
            isPerfect 
              ? 'bg-[#00FFFF] shadow-[8px_8px_0px_#000000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[6px_6px_0px_#000000] active:translate-y-[8px] active:translate-x-[8px] active:shadow-none' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
          }`}
        >
          {isPerfect ? 'CONFIRM & LAUNCH TRACKER' : 'BALANCE BUDGET TO CONTINUE'}
        </button>

      </main>
    </div>
  );
}
