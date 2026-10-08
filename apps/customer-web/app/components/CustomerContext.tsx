'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_PROFILES, type CustomerProfile } from './CustomerAuthModal';

interface CustomerContextType {
  activeProfile: CustomerProfile;
  setActiveProfile: (profile: CustomerProfile) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<CustomerProfile>(DEFAULT_PROFILES[0]!);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('csp_active_customer_id');
    if (savedId) {
      const customStore = localStorage.getItem('csp_custom_customer_profiles');
      let custom: CustomerProfile[] = [];
      if (customStore) {
        try {
          custom = JSON.parse(customStore);
        } catch {
          // ignore
        }
      }
      const all = [...custom, ...DEFAULT_PROFILES];
      const found = all.find((p) => p.id === savedId);
      if (found) setActiveProfileState(found);
    }
  }, []);

  const setActiveProfile = (profile: CustomerProfile) => {
    setActiveProfileState(profile);
    localStorage.setItem('csp_active_customer_id', profile.id);
  };

  return (
    <CustomerContext.Provider
      value={{
        activeProfile,
        setActiveProfile,
        isAuthOpen,
        setIsAuthOpen,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
