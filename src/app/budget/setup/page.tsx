'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';
import { useBudget, UpfrontPayment } from '@/components/providers/BudgetProvider';

export default function BudgetSetup() {
  const router = useRouter();
  const { state, setSetupData } = useBudget();
  
  const [totalBudget, setTotalBudget] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [activeMembers, setActiveMembers] = useState<string[]>(['You']);
  const [upfrontPayments, setUpfrontPayments] = useState<UpfrontPayment[]>([]);
  const [newMember, setNewMember] = useState('');

  // If no trip selected, go back to screen 1
  useEffect(() => {
    if (!state.selectedTrip) {
      router.push('/budget');
    }
  }, [state.selectedTrip, router]);

  if (!state.selectedTrip) return null;

  const handleAddMember = () => {
    if (!newMember.trim() || activeMembers.includes(newMember.trim())) return;
    setActiveMembers([...activeMembers, newMember.trim()]);
    setNewMember('');
  };

  const removeMember = (member: string) => {
    setActiveMembers(activeMembers.filter(m => m !== member));
    // Also remove any upfront payments associated with them
    setUpfrontPayments(upfrontPayments.filter(p => p.member !== member));
  };

  const addUpfrontPayment = () => {
    setUpfrontPayments([...upfrontPayments, { member: activeMembers[0] || 'You', amount: 0 }]);
  };

  const updateUpfrontPayment = (index: number, field: keyof UpfrontPayment, value: any) => {
    const updated = [...upfrontPayments];
    updated[index] = { ...updated[index], [field]: value };
    setUpfrontPayments(updated);
  };

  const removeUpfrontPayment = (index: number) => {
    setUpfrontPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (!totalBudget || Number(totalBudget) <= 0) {
      alert("Please enter a valid total budget.");
      return;
    }
    if (activeMembers.length === 0) {
      alert("You need at least one member to split the budget.");
      return;
    }
    
    setSetupData(Number(totalBudget), currency, activeMembers, upfrontPayments);
    router.push('/budget/split');
  };

  return (
    <div className="bg-cs-yellow min-h-screen font-body text-cs-black pb-24 selection:bg-cs-black selection:text-[#f90680]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-8 relative">
        <button onClick={() => router.back()} className="font-bold text-lg uppercase flex items-center gap-2 hover:translate-x-1 transition-transform self-start">
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>

        <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4 bg-white border-4 border-cs-black inline-block p-4 shadow-[8px_8px_0px_#000000] rotate-[-1deg] self-start">
          BUDGET SETUP
        </h1>
        
        <p className="font-bold text-xl mb-4 bg-cs-cyan border-4 border-cs-black px-4 py-2 inline-block self-start shadow-[4px_4px_0px_#000000]">
          {state.selectedTrip.title} • {state.selectedTrip.duration_days} Days
        </p>

        <div className="bg-white border-4 border-cs-black p-8 shadow-[8px_8px_0px_#000000] flex flex-col gap-8">
          
          {/* Section 1: Total Budget */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display font-black text-3xl uppercase">1. Total Budget</h2>
            <div className="flex gap-4 items-center">
              <select 
                className="border-4 border-cs-black p-4 font-black text-xl bg-cs-yellow outline-none shadow-[4px_4px_0px_#000000] focus:shadow-none focus:translate-y-1 focus:translate-x-1 transition-all"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="JPY">JPY</option>
              </select>
              <input 
                type="number" 
                placeholder="e.g. 5000"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full border-4 border-cs-black p-4 font-black text-2xl outline-none shadow-[4px_4px_0px_#000000] focus:shadow-none focus:translate-y-1 focus:translate-x-1 transition-all"
              />
            </div>
          </section>

          {/* Section 2: Active Members */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display font-black text-3xl uppercase">2. Who's Splitting?</h2>
            <p className="font-bold text-cs-black/70">Add everyone who is sharing the budget.</p>
            
            <div className="flex flex-col gap-2 w-full md:w-1/2 mt-2">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember(); }}
                  placeholder="Enter friend's name"
                  className="border-4 border-cs-black p-3 font-bold outline-none flex-grow"
                />
                <button 
                  onClick={handleAddMember} 
                  className="bg-cs-yellow border-4 border-cs-black px-4 font-black uppercase shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-2">
              {activeMembers.map(member => (
                <div 
                  key={member}
                  className="flex items-center gap-2 px-4 py-3 border-4 border-cs-black font-black uppercase text-lg bg-cs-cyan shadow-[4px_4px_0px_#000000]"
                >
                  {member}
                  {member !== 'You' && (
                    <button 
                      onClick={() => removeMember(member)}
                      className="ml-2 font-bold hover:text-[#f90680]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Upfront Payments */}
          <section className="flex flex-col gap-4 border-t-4 border-cs-black pt-8">
            <div className="flex justify-between items-center">
              <h2 className="font-display font-black text-3xl uppercase">3. Upfront Payments</h2>
              <button 
                onClick={addUpfrontPayment}
                className="bg-[#f90680] text-white border-4 border-cs-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_#000000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined">add</span> ADD
              </button>
            </div>
            <p className="font-bold text-cs-black/70">Did someone already pre-pay for flights or hotels? Add it here to seed their balance.</p>
            
            {upfrontPayments.length === 0 ? (
              <div className="bg-gray-100 border-4 border-cs-black border-dashed p-6 text-center font-bold text-gray-500 uppercase">
                No upfront payments added
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {upfrontPayments.map((payment, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-4 items-center bg-gray-50 border-4 border-cs-black p-4">
                    <select 
                      className="w-full md:w-auto border-4 border-cs-black p-3 font-bold bg-white outline-none"
                      value={payment.member}
                      onChange={(e) => updateUpfrontPayment(i, 'member', e.target.value)}
                    >
                      {activeMembers.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <div className="font-black text-xl uppercase whitespace-nowrap">Paid {currency}</div>
                    <input 
                      type="number"
                      className="w-full md:w-48 border-4 border-cs-black p-3 font-bold outline-none"
                      placeholder="Amount"
                      value={payment.amount || ''}
                      onChange={(e) => updateUpfrontPayment(i, 'amount', Number(e.target.value))}
                    />
                    <button 
                      onClick={() => removeUpfrontPayment(i)}
                      className="w-full md:w-auto bg-cs-black text-white p-3 font-black flex items-center justify-center hover:bg-[#f90680] transition-colors"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button 
            onClick={handleContinue}
            className="mt-8 bg-[#00FFFF] border-4 border-cs-black py-4 font-display font-black text-2xl uppercase tracking-widest shadow-[8px_8px_0px_#000000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[6px_6px_0px_#000000] active:translate-y-[8px] active:translate-x-[8px] active:shadow-none transition-all w-full"
          >
            CONTINUE TO SPLIT
          </button>
        </div>

      </main>
    </div>
  );
}
