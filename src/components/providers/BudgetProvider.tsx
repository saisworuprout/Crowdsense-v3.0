'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Models
export interface TripContextData {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
}

export interface UpfrontPayment {
  member: string;
  amount: number;
}

export interface CategoryAllocation {
  name: string;
  amount: number;
  percentage: number;
}

export interface BudgetState {
  selectedTrip: TripContextData | null;
  totalBudget: number;
  currency: string;
  activeMembers: string[];
  upfrontPayments: UpfrontPayment[];
  categoryAllocations: CategoryAllocation[];
}

export interface BudgetContextType {
  state: BudgetState;
  setTrip: (trip: TripContextData) => void;
  setSetupData: (totalBudget: number, currency: string, activeMembers: string[], upfrontPayments: UpfrontPayment[]) => void;
  setCategoryAllocations: (allocations: CategoryAllocation[]) => void;
  resetBudgetState: () => void;
}

const initialState: BudgetState = {
  selectedTrip: null,
  totalBudget: 0,
  currency: 'USD',
  activeMembers: [],
  upfrontPayments: [],
  categoryAllocations: []
};

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BudgetState>(initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('cs_budget_state');
      if (saved) {
        setState(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load budget state from session storage");
    }
    setIsInitialized(true);
  }, []);

  // Save to sessionStorage when state changes
  useEffect(() => {
    if (isInitialized) {
      sessionStorage.setItem('cs_budget_state', JSON.stringify(state));
    }
  }, [state, isInitialized]);

  const setTrip = (trip: TripContextData) => {
    setState(prev => ({ ...prev, selectedTrip: trip }));
  };

  const setSetupData = (totalBudget: number, currency: string, activeMembers: string[], upfrontPayments: UpfrontPayment[]) => {
    setState(prev => ({ ...prev, totalBudget, currency, activeMembers, upfrontPayments }));
  };

  const setCategoryAllocations = (allocations: CategoryAllocation[]) => {
    setState(prev => ({ ...prev, categoryAllocations: allocations }));
  };

  const resetBudgetState = () => {
    setState(initialState);
    sessionStorage.removeItem('cs_budget_state');
  };

  return (
    <BudgetContext.Provider value={{ state, setTrip, setSetupData, setCategoryAllocations, resetBudgetState }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
