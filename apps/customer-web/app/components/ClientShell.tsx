'use client';

import React from 'react';
import { CustomerProvider, useCustomer } from './CustomerContext';
import SideNav from './SideNav';
import TopNav from './TopNav';
import { CustomerAuthModal } from './CustomerAuthModal';

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { isAuthOpen, setIsAuthOpen, activeProfile, setActiveProfile } = useCustomer();

  return (
    <div className="min-h-screen bg-background text-on-background font-sans flex selection:bg-primary-container selection:text-on-primary-container">
      {/* Side Navigation Bar */}
      <SideNav />

      {/* Main Content Frame */}
      <div className="flex-1 ms-60 flex flex-col min-h-screen">
        <TopNav />
        <main className="pt-16 flex-1 flex flex-col">{children}</main>
      </div>

      {/* Global Customer Auth & Persona Switcher */}
      <CustomerAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        activeProfile={activeProfile}
        onSelectProfile={setActiveProfile}
      />
    </div>
  );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <CustomerProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </CustomerProvider>
  );
}
