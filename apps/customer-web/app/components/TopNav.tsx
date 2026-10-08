'use client';

import React from 'react';
import { Network } from 'lucide-react';
import { useCustomer } from './CustomerContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


export default function TopNav() {
  const { activeProfile, setIsAuthOpen } = useCustomer();

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-240px)] bg-surface-dim/80 backdrop-blur-xl border-b border-white/10 flex justify-end items-center h-16 px-gutter z-40">

      {/* Trailing Actions */}
      <div className="flex items-center gap-3">

        <button
          className="text-on-surface-variant hover:text-primary transition-all p-2 rounded-full hover:bg-white/5"
          title="LangGraph System Topology"
          type="button"
        >
          <Network className="size-4" />
        </button>

        <div className="h-5 w-px bg-white/10 mx-1" />

        {/* Profile / Customer Identity Selector */}
        <button
          onClick={() => setIsAuthOpen(true)}
          className="flex items-center gap-2.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 transition-all cursor-pointer"
          title="Switch customer profile"
          type="button"
        >
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className={`bg-gradient-to-tr ${activeProfile.avatarColor} text-[10px] font-bold text-white`}>
              {activeProfile.name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="text-start hidden sm:block">
            <div className="text-xs font-semibold text-on-surface flex items-center gap-1.5 leading-none">
              <span>{activeProfile.name}</span>
              <span className="text-[9px] font-mono px-1 py-0.2 bg-primary/20 text-primary rounded">
                L{activeProfile.authLevel}
              </span>
            </div>
            <span className="text-[10px] font-mono text-outline block leading-none mt-1">
              {activeProfile.tier}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
