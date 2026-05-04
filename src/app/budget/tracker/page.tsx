'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { useBudget } from '@/components/providers/BudgetProvider';

type BudgetCategory = {
  id: string;
  name: string;
  allocated_amount: number;
  percentage: number;
};

type BudgetRecord = {
  id: string;
  trip_id: string;
  total_amount: number;
  currency: string;
  active_members: string[];
  upfront_payments: UpfrontPaymentRecord[];
};

type UpfrontPaymentRecord = {
  member: string;
  amount: number;
};

type ExpenseRecord = {
  id: string;
  budget_id: string;
  amount: number;
  category: string;
  description?: string | null;
  paid_by: string;
  date: string;
};

type ExpenseSplitRecord = {
  id: string;
  expense_id: string;
  member: string;
  amount_owed: number;
  settled: boolean;
};

type TripRecord = {
  id: string;
  title: string;
};

type NewExpenseData = {
  amount: number;
  category: string;
  description: string;
  paidBy: string;
};

type NewSplitData = {
  member: string;
  amount_owed: number;
};

type ChatMessage = {
  id: string;
  member: string;
  text: string;
  createdAt: string;
};

// Helper function
const getCategoryStyle = (name: string) => {
  if (!name) return { bg: 'bg-cs-yellow', icon: 'receipt_long', barColor: 'bg-cs-black', text: 'text-cs-black' };
  const n = name.toLowerCase();
  if (n.includes('stay') || n.includes('hotel')) return { bg: 'bg-cs-cyan', icon: 'bed', barColor: 'bg-cs-black', text: 'text-cs-black' };
  if (n.includes('flight') || n.includes('travel') || n.includes('transport')) return { bg: 'bg-white', icon: 'flight_takeoff', barColor: 'bg-cs-black', text: 'text-cs-black' };
  if (n.includes('food') || n.includes('eat') || n.includes('dine') || n.includes('restaurant')) return { bg: 'bg-[#f90680]', icon: 'restaurant', barColor: 'bg-cs-yellow border-r-4 border-cs-black', text: 'text-white' };
  if (n.includes('fun') || n.includes('activit')) return { bg: 'bg-white', icon: 'local_activity', barColor: 'bg-cs-black border-r-4 border-cs-black', text: 'text-cs-black' };
  return { bg: 'bg-cs-yellow', icon: 'receipt_long', barColor: 'bg-cs-black', text: 'text-cs-black' };
};

type CategoryStyle = ReturnType<typeof getCategoryStyle>;

const normalizeCategories = (categories: Array<Partial<BudgetCategory> & { amount?: number }>, budgetId?: string): BudgetCategory[] => {
  return categories
    .filter(cat => cat?.name)
    .map((cat, index) => ({
      id: cat.id || `${budgetId || 'session'}-${cat.name}-${index}`,
      name: cat.name || '',
      allocated_amount: Number(cat.allocated_amount ?? cat.amount ?? 0),
      percentage: Number(cat.percentage ?? 0)
    }));
};

export default function BudgetTracker() {
  return (
    <Suspense fallback={<div className="p-12 font-black text-2xl uppercase">Loading Budget...</div>}>
      <BudgetTrackerContent />
    </Suspense>
  );
}

function BudgetTrackerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams?.get('tripId');
  const { user } = useAuth();
  const { state: budgetState } = useBudget();

  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<BudgetRecord | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [splits, setSplits] = useState<ExpenseSplitRecord[]>([]);
  const [trip, setTrip] = useState<TripRecord | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tripId) return;

    await Promise.resolve();
    setLoading(true);
    // Fetch trip
    const { data: tripData } = await supabase.from('trips').select('*').eq('id', tripId).single();
    if (tripData) setTrip(tripData as TripRecord);

    // Fetch budget
    const { data: budgetData } = await supabase.from('budgets').select('*').eq('trip_id', tripId).single();
    if (budgetData) {
      const nextBudget = budgetData as BudgetRecord;
      setBudget(nextBudget);
      
      // Fetch categories
      const { data: catData } = await supabase.from('budget_categories').select('*').eq('budget_id', nextBudget.id);
      const normalizedCategories = normalizeCategories((catData || []) as BudgetCategory[], nextBudget.id);
      if (normalizedCategories.length > 0) {
        setCategories(normalizedCategories);
      } else if (budgetState.selectedTrip?.id === tripId && budgetState.categoryAllocations.length > 0) {
        setCategories(normalizeCategories(budgetState.categoryAllocations, nextBudget.id));
      } else {
        setCategories([]);
      }

      // Fetch expenses
      const { data: expData } = await supabase.from('expenses').select('*').eq('budget_id', nextBudget.id).order('date', { ascending: false });
      if (expData) {
        setExpenses(expData as ExpenseRecord[]);
        // Fetch splits for these expenses
        const expIds = expData.map(e => e.id);
        if (expIds.length > 0) {
          const { data: splitData } = await supabase.from('expense_splits').select('*').in('expense_id', expIds);
          if (splitData) setSplits(splitData as ExpenseSplitRecord[]);
        } else {
          setSplits([]);
        }
      }
    }
    setLoading(false);
  }, [budgetState.categoryAllocations, budgetState.selectedTrip?.id, tripId]);

  useEffect(() => {
    if (!tripId || !user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData, tripId, user]);

  const handleAddExpense = async (expenseData: NewExpenseData, splitData: NewSplitData[]) => {
    if (!budget) return;

    const { data: newExp } = await supabase
      .from('expenses')
      .insert({
        budget_id: budget.id,
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.description,
        paid_by: expenseData.paidBy,
        date: new Date().toISOString()
      })
      .select()
      .single();

    if (newExp) {
      const splitInserts = splitData.map(s => ({
        expense_id: newExp.id,
        member: s.member,
        amount_owed: s.amount_owed,
        settled: false
      }));
      await supabase.from('expense_splits').insert(splitInserts);
    }
    setShowAddModal(false);
    fetchData();
  };

  const handleSettleSplit = async (splitId: string) => {
    await supabase.from('expense_splits').update({ settled: true }).eq('id', splitId);
    fetchData();
  };

  // Calculations
  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const currency = budget?.currency || 'USD';
  
  // Category Spend
  const categorySpend = useMemo(() => {
    const spendMap: Record<string, number> = {};
    expenses.forEach(e => {
      spendMap[e.category] = (spendMap[e.category] || 0) + Number(e.amount);
    });
    return spendMap;
  }, [expenses]);

  // Settle Up Algorithm (Minimize Transactions)
  const debts = useMemo(() => {
    if (!budget) return [];
    const balances: Record<string, number> = {};
    
    // Initialize balances from active members + upfront payments
    budget.active_members.forEach((m: string) => balances[m] = 0);
    budget.upfront_payments.forEach((p: UpfrontPaymentRecord) => {
      if (balances[p.member] !== undefined) balances[p.member] += Number(p.amount);
    });

    // Add paid amounts
    expenses.forEach(e => {
      if (balances[e.paid_by] !== undefined) balances[e.paid_by] += Number(e.amount);
    });

    // Subtract owed amounts (only unsettled splits)
    splits.filter(s => !s.settled).forEach(s => {
      if (balances[s.member] !== undefined) balances[s.member] -= Number(s.amount_owed);
    });

    // Separate debtors and creditors
    const debtors = [];
    const creditors = [];
    for (const [member, balance] of Object.entries(balances)) {
      if (balance < -0.01) debtors.push({ member, amount: -balance });
      else if (balance > 0.01) creditors.push({ member, amount: balance });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplified = [];
    let i = 0; let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      simplified.push({
        from: debtor.member,
        to: creditor.member,
        amount: Number(amount.toFixed(2))
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return simplified;
  }, [budget, expenses, splits]);

  // Find Crowd Intel trigger
  const crowdIntelTrigger = categories.reduce<{ category: string; overagePct: number } | null>((trigger, cat) => {
    if (trigger) return trigger;

    const spent = categorySpend[cat.name] || 0;
    const allocated = Number(cat.allocated_amount);
    if (allocated > 0 && spent > allocated * 1.2) {
      return {
        category: cat.name,
        overagePct: Math.round(((spent - allocated) / allocated) * 100)
      };
    }

    return null;
  }, null);

  const visibleCategories = categories.filter(c => !selectedCategory || c.name === selectedCategory);
  const visibleExpenses = expenses.filter(e => !selectedCategory || e.category === selectedCategory);

  if (loading) return <div className="p-12 font-black text-2xl uppercase">Loading Budget...</div>;
  if (!budget) return <div className="p-12 font-black text-2xl uppercase">No Budget Found. <Link href="/budget" className="underline text-[#f90680]">Set one up.</Link></div>;

  return (
    <div className="bg-cs-yellow min-h-screen font-body text-cs-black pb-24 selection:bg-cs-black selection:text-[#f90680]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        
        {/* Left Column: Spend vs Budget & Expenses */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4">
            <div>
              <button onClick={() => router.back()} className="inline-flex items-center gap-2 bg-white border-4 border-cs-black px-4 py-2 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 transition-all mb-4">
                <span className="material-symbols-outlined text-cs-black font-bold">arrow_back</span>
                Back
              </button>
              <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-2 mt-2">
                {trip?.title || "TRACKER"}
              </h1>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-2">
              <div className="w-12 h-12 border-4 border-cs-black bg-cs-cyan flex items-center justify-center font-display font-black text-xl shadow-[4px_4px_0px_#000000]">
                {budget.active_members.length}
              </div>
            </div>
          </div>
          
          {/* Spend vs Budget Hero */}
          <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-8 flex flex-col gap-6 relative overflow-hidden">
            <h2 className="font-display text-3xl font-black uppercase tracking-tight">TOTAL SPEND</h2>
            <div className="flex items-end gap-4">
              <span className="font-display text-6xl md:text-8xl font-black leading-none tracking-tighter">{currency} {totalSpend.toLocaleString()}</span>
              <span className="font-bold text-2xl text-cs-black/60 pb-2">/ {budget.total_amount.toLocaleString()}</span>
            </div>
            
            <div className="w-full h-8 bg-gray-200 border-4 border-cs-black relative mt-4">
              <div className="absolute top-0 left-0 h-full bg-[#f90680] border-r-4 border-cs-black transition-all" style={{ width: `${Math.min((totalSpend / budget.total_amount) * 100, 100)}%` }}></div>
            </div>
            <div className="flex justify-between font-bold uppercase text-sm mt-1">
              <span>{Math.round((totalSpend / budget.total_amount) * 100)}% USED</span>
              <span>{currency} {Math.max(budget.total_amount - totalSpend, 0).toLocaleString()} REMAINING</span>
            </div>
          </section>
          
          {/* Spend Categories */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(cat => {
              const spent = categorySpend[cat.name] || 0;
              const allocated = Number(cat.allocated_amount);
              const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
              const isOver = pct > 100;
              
              const style = getCategoryStyle(cat.name);
              const isSelected = selectedCategory === cat.name;
              
              // If selected, invert colors or make it stand out
              const bgClass = isOver ? 'bg-[#f90680] text-white' : `${style.bg} ${style.text}`;
              const barColorClass = isOver ? 'bg-cs-yellow border-r-4 border-cs-black' : style.barColor;
              const trackColorClass = (style.bg === 'bg-[#f90680]' || isOver) ? 'bg-white' : 'bg-gray-200';
              
              return (
                <div 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                  className={`${bgClass} border-4 border-cs-black p-4 flex flex-col gap-2 transition-transform cursor-pointer
                    ${isSelected ? 'translate-y-[4px] translate-x-[4px] shadow-none ring-4 ring-cs-cyan ring-offset-2' : 'shadow-[8px_8px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000]'}
                  `}
                >
                  <span className={`material-symbols-outlined text-4xl mb-2 ${isOver ? 'text-white' : style.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>{style.icon}</span>
                  <h3 className={`font-display font-black text-xl uppercase leading-tight ${isOver ? 'border-b-4 border-cs-black pb-1 mb-1' : ''}`}>{cat.name}</h3>
                  <div className="font-bold text-2xl">{currency} {spent.toLocaleString()}</div>
                  <div className={`w-full h-3 ${trackColorClass} border-4 border-cs-black mt-auto relative`}>
                    <div className={`absolute top-0 left-0 h-full ${barColorClass}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Expense Feed */}
          <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-8 flex flex-col gap-6 mt-4 relative">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight">EXPENSE LOG</h2>
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="bg-cs-black text-white px-3 py-1 font-bold text-sm flex items-center gap-1 hover:bg-[#f90680]"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  {selectedCategory}
                </button>
              )}
            </div>
            
            {/* Category Breakdown Rows inside Expense Log */}
            <div className="flex flex-col gap-3 mb-2">
              {visibleCategories.map(cat => (
                <AllocationLogCard
                  key={cat.id}
                  cat={cat}
                  spent={categorySpend[cat.name] || 0}
                  currency={currency}
                />
              ))}
            </div>
            
            {visibleExpenses.length === 0 ? (
              <div className="border-4 border-cs-black border-dashed bg-gray-50 p-5 flex flex-col gap-2">
                <p className="font-black uppercase text-lg">No expenses logged yet{selectedCategory ? ` for ${selectedCategory}` : ''}.</p>
                <p className="font-bold text-gray-500">Your selected budget categories are ready above. Use the pink plus button to add the first real expense.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {visibleExpenses.map(exp => {
                  const cat = categories.find(c => c.name === exp.category);
                  const allocated = cat ? Number(cat.allocated_amount) : undefined;
                  const catStyle = getCategoryStyle(exp.category);
                  return (
                    <ExpenseItem 
                      key={exp.id} 
                      exp={exp} 
                      splits={splits.filter(s => s.expense_id === exp.id)} 
                      currency={currency} 
                      handleSettleSplit={handleSettleSplit} 
                      catStyle={catStyle}
                      categoryAllocated={allocated}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
        
        {/* Right Column: Settle Up & AI Insights */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {crowdIntelTrigger && (
            <aside className="bg-white border-4 border-cs-cyan shadow-[8px_8px_0px_#00FFFF] p-6 relative">
              <div className="absolute -top-5 -right-5 bg-cs-black text-cs-yellow w-12 h-12 flex items-center justify-center rounded-full font-black text-2xl border-4 border-cs-cyan">!</div>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-cs-cyan text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                <h3 className="font-display font-black text-xl uppercase tracking-tighter">CROWD INTEL</h3>
              </div>
              <p className="font-bold text-lg leading-snug mb-4">
                You are spending <span className="bg-[#f90680] text-white px-1">{crowdIntelTrigger.overagePct}% more</span> on {crowdIntelTrigger.category} than budgeted.
              </p>
              <button className="w-full py-3 bg-cs-black text-white font-display font-black uppercase tracking-tight hover:bg-cs-cyan hover:text-cs-black transition-colors border-4 border-cs-black shadow-[4px_4px_0px_#000000] hover:translate-y-[2px] hover:translate-x-[2px] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none">
                REVIEW {crowdIntelTrigger.category} PLAN
              </button>
            </aside>
          )}

          <TripChatPanel
            tripId={tripId || budget.trip_id}
            members={budget.active_members}
            expenses={expenses}
            currency={currency}
          />
          
          <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 flex flex-col gap-6">
            <h2 className="font-display text-3xl font-black uppercase tracking-tight bg-cs-yellow inline-block px-2 -ml-2 w-max border-4 border-cs-black">
              SETTLE UP
            </h2>
            <div className="flex flex-col gap-4">
              {debts.length === 0 ? (
                <p className="font-bold text-gray-500">Everyone is settled up! 🎉</p>
              ) : (
                debts.map((debt, i) => (
                  <div key={i} className="flex items-center justify-between border-b-4 border-cs-black pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-display font-black uppercase leading-none">{debt.from}</span>
                      <span className="text-sm font-bold text-cs-black/60">Owes {debt.to}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-black text-xl text-[#f90680] leading-none">{currency} {debt.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#f90680] text-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] flex items-center justify-center hover:-translate-y-2 hover:shadow-[12px_16px_0px_#000000] active:translate-y-0 active:shadow-[4px_4px_0px_#000000] transition-all z-40 rounded-none"
      >
        <span className="material-symbols-outlined text-4xl font-black">add</span>
      </button>

      {showAddModal && (
        <AddExpenseModal 
          categories={categories} 
          members={budget.active_members} 
          currency={currency}
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddExpense} 
        />
      )}
    </div>
  );
}

// Subcomponents

function TripChatPanel({
  tripId,
  members,
  expenses,
  currency
}: {
  tripId: string;
  members: string[];
  expenses: ExpenseRecord[];
  currency: string;
}) {
  const storageKey = `cs_budget_chat_${tripId}`;
  const [selectedMember, setSelectedMember] = useState(members[0] || '');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const selectedMemberName = members.includes(selectedMember) ? selectedMember : members[0] || '';

  const memberSpend = members.map(member => ({
    member,
    total: expenses
      .filter(exp => exp.paid_by === member)
      .reduce((sum, exp) => sum + Number(exp.amount), 0)
  }));

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const handleSend = () => {
    const text = messageText.trim();
    if (!text || !selectedMemberName) return;

    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${selectedMemberName}`;

    setMessages(prev => [
      ...prev,
      {
        id,
        member: selectedMemberName,
        text,
        createdAt: new Date().toISOString()
      }
    ]);
    setMessageText('');
  };

  return (
    <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-black uppercase tracking-tight">TEAM CHAT</h2>
        <span className="material-symbols-outlined text-3xl text-[#f90680]" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
        {memberSpend.map(item => (
          <div key={item.member} className="border-4 border-cs-black bg-cs-yellow p-3 shadow-[4px_4px_0px_#000000] min-w-0">
            <div className="font-display font-black uppercase truncate">{item.member}</div>
            <div className="font-black text-xl text-[#f90680] leading-none mt-1">
              {currency} {item.total.toLocaleString()}
            </div>
            <div className="font-bold text-xs uppercase text-cs-black/60 mt-1">Spent</div>
          </div>
        ))}
      </div>

      <div className="border-4 border-cs-black bg-gray-50 p-3 h-56 overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 ? (
          <p className="font-bold text-gray-500 uppercase text-sm">No messages yet. Drop the first update.</p>
        ) : (
          messages.map(message => (
            <div key={message.id} className="bg-white border-4 border-cs-black p-3 shadow-[3px_3px_0px_#000000]">
              <div className="flex justify-between gap-2 mb-1">
                <span className="font-display font-black uppercase truncate">{message.member}</span>
                <span className="font-bold text-xs text-gray-500 whitespace-nowrap">
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="font-bold text-sm break-words">{message.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <select
          value={selectedMemberName}
          onChange={e => setSelectedMember(e.target.value)}
          className="w-full border-4 border-cs-black p-3 font-black uppercase outline-none"
        >
          {members.map(member => (
            <option key={member} value={member}>{member}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            className="min-w-0 flex-1 border-4 border-cs-black p-3 font-bold outline-none"
            placeholder="Share an update"
          />
          <button
            onClick={handleSend}
            className="w-14 border-4 border-cs-black bg-[#f90680] text-white shadow-[4px_4px_0px_#000000] flex items-center justify-center hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000000] transition-all"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined font-black">send</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function AllocationLogCard({ cat, spent, currency }: { cat: BudgetCategory; spent: number; currency: string }) {
  const allocated = Number(cat.allocated_amount);
  const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
  const style = getCategoryStyle(cat.name);

  return (
    <div className="bg-gray-50 border-4 border-cs-black p-4 flex flex-col md:flex-row justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border-4 border-cs-black shadow-[4px_4px_0px_#000000] ${style.bg} ${style.text}`}>
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {style.icon}
          </span>
        </div>
        <div>
          <span className="font-display font-black text-2xl uppercase leading-none">{cat.name}</span>
          <div className="font-bold text-sm text-gray-500 uppercase mt-1">
            {currency} {spent.toLocaleString()} spent of {currency} {allocated.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:items-end gap-2 min-w-48">
        <div className="flex gap-4 items-center font-black text-xl">
          <span>{currency} {allocated.toLocaleString()}</span>
          <span>=</span>
          <span>{cat.percentage}%</span>
        </div>
        <div className="w-full h-3 bg-white border-4 border-cs-black relative">
          <div className={`absolute top-0 left-0 h-full ${style.barColor}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
        </div>
      </div>
    </div>
  );
}

function ExpenseItem({
  exp,
  splits,
  currency,
  handleSettleSplit,
  catStyle,
  categoryAllocated
}: {
  exp: ExpenseRecord;
  splits: ExpenseSplitRecord[];
  currency: string;
  handleSettleSplit: (splitId: string) => void;
  catStyle: CategoryStyle;
  categoryAllocated?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b-4 border-cs-black pb-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border-4 border-cs-black shadow-[4px_4px_0px_#000000] ${catStyle?.bg || 'bg-cs-yellow'} ${catStyle?.text || 'text-cs-black'}`}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {catStyle?.icon || 'receipt_long'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg uppercase leading-tight">{exp.description || exp.category}</span>
            <span className="text-sm font-bold text-gray-500">
              {new Date(exp.date).toLocaleDateString()} • Paid by {exp.paid_by}
            </span>
            {categoryAllocated !== undefined && (
              <span className="text-xs font-bold bg-gray-200 text-cs-black border-2 border-cs-black px-1 mt-1 inline-block w-max">
                {exp.category} (Allocated: {currency} {categoryAllocated})
              </span>
            )}
          </div>
        </div>
        <span className="font-black text-xl whitespace-nowrap">{currency} {exp.amount}</span>
      </div>
      {expanded && (
        <div className="mt-4 p-4 bg-gray-100 border-4 border-cs-black text-sm flex flex-col gap-2 ml-16">
          <h4 className="font-black uppercase">Split Breakdown:</h4>
          {splits.map((s: ExpenseSplitRecord) => (
            <div key={s.id} className="flex justify-between items-center">
              <span className="font-bold">{s.member} owes {currency} {s.amount_owed}</span>
              {!s.settled ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSettleSplit(s.id); }}
                  className="bg-cs-cyan border-2 border-cs-black px-2 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_#000000]"
                >
                  Mark Settled
                </button>
              ) : (
                <span className="font-black text-green-600 text-xs uppercase">Settled</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddExpenseModal({
  categories,
  members,
  currency,
  onClose,
  onSave
}: {
  categories: BudgetCategory[];
  members: string[];
  currency: string;
  onClose: () => void;
  onSave: (expenseData: NewExpenseData, splitData: NewSplitData[]) => void;
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState(members[0] || '');
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL, CUSTOM
  const hasCategories = categories.length > 0;
  const selectedCategoryName = hasCategories && categories.some(c => c.name === category) ? category : categories[0]?.name || '';
  
  // Custom split map
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});

  const handleSave = () => {
    if (!amount || !selectedCategoryName || members.length === 0) return;
    
    let finalSplits: NewSplitData[] = [];
    const numAmt = Number(amount);

    if (splitType === 'EQUAL') {
      const share = Number((numAmt / members.length).toFixed(2));
      finalSplits = members.map((m: string) => ({
        member: m,
        amount_owed: share
      }));
    } else {
      // CUSTOM
      const totalCustom = Object.values(customSplits).reduce((sum, val) => sum + Number(val || 0), 0);
      if (Math.abs(totalCustom - numAmt) > 0.1) {
        alert("Custom splits must add up exactly to the total amount.");
        return;
      }
      finalSplits = Object.keys(customSplits).map(m => ({
        member: m,
        amount_owed: Number(customSplits[m])
      }));
    }

    onSave({ amount: numAmt, category: selectedCategoryName, description, paidBy }, finalSplits);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-cs-black shadow-[16px_16px_0px_#000000] p-8 w-full max-w-lg flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="font-display font-black text-3xl uppercase">ADD EXPENSE</h2>
          <button onClick={onClose} className="font-black text-2xl hover:text-[#f90680]">✕</button>
        </div>

        <div className="flex gap-4">
          <div className="w-1/3">
            <label className="font-black uppercase text-sm mb-1 block">Currency</label>
            <div className="border-4 border-cs-black p-3 font-black bg-gray-100">{currency}</div>
          </div>
          <div className="w-2/3">
            <label className="font-black uppercase text-sm mb-1 block">Amount</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className="w-full border-4 border-cs-black p-3 font-black text-xl outline-none"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="font-black uppercase text-sm mb-1 block">Description</label>
          <input 
            type="text" 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            className="w-full border-4 border-cs-black p-3 font-bold outline-none"
            placeholder="e.g. Dinner at Ichiran"
          />
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="font-black uppercase text-sm mb-1 block">Category</label>
            {hasCategories ? (
              <select value={selectedCategoryName} onChange={e => setCategory(e.target.value)} className="w-full border-4 border-cs-black p-3 font-bold outline-none">
                {categories.map((c: BudgetCategory) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            ) : (
              <div className="w-full border-4 border-cs-black p-3 font-bold bg-gray-100 text-gray-500">
                No categories allocated
              </div>
            )}
          </div>
          <div className="w-1/2">
            <label className="font-black uppercase text-sm mb-1 block">Paid By</label>
            <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="w-full border-4 border-cs-black p-3 font-bold outline-none">
              {members.map((m: string) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t-4 border-cs-black pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black uppercase text-xl">Split Method</h3>
            <div className="flex bg-gray-200 border-4 border-cs-black">
              <button 
                onClick={() => setSplitType('EQUAL')}
                className={`px-4 py-1 font-black text-sm uppercase ${splitType === 'EQUAL' ? 'bg-cs-black text-white' : ''}`}
              >Equal</button>
              <button 
                onClick={() => setSplitType('CUSTOM')}
                className={`px-4 py-1 font-black text-sm uppercase ${splitType === 'CUSTOM' ? 'bg-cs-black text-white' : ''}`}
              >Custom</button>
            </div>
          </div>

          {splitType === 'EQUAL' ? (
            <div className="font-bold text-center p-4 bg-gray-100 border-4 border-cs-black border-dashed">
              Split equally among {members.length} people <br/>
              ({currency} {((Number(amount) || 0) / members.length).toFixed(2)} each)
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((m: string) => (
                <div key={m} className="flex justify-between items-center">
                  <span className="font-bold uppercase">{m}</span>
                  <input 
                    type="number"
                    value={customSplits[m] || ''}
                    onChange={e => setCustomSplits({ ...customSplits, [m]: Number(e.target.value) })}
                    className="w-32 border-4 border-cs-black p-2 font-bold outline-none"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={handleSave}
          disabled={!hasCategories}
          className="mt-4 bg-[#f90680] disabled:bg-gray-400 disabled:cursor-not-allowed text-white border-4 border-cs-black py-4 font-display font-black text-2xl uppercase tracking-widest shadow-[8px_8px_0px_#000000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_#000000] transition-all"
        >
          SAVE EXPENSE
        </button>
      </div>
    </div>
  );
}
