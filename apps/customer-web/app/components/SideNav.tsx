'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Ticket,
  Headphones,
  Settings,
  HelpCircle,
  LogOut,
  Bot,
  PlusCircle,
} from 'lucide-react';
import { useCustomer } from './CustomerContext';

export default function SideNav() {
  const pathname = usePathname();
  const { setIsAuthOpen, activeProfile } = useCustomer();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      isActive: pathname === '/',
    },
    {
      label: 'Chat',
      href: '/chat',
      icon: MessageSquare,
      isActive: pathname === '/chat',
    },
    {
      label: 'Live Support',
      href: '/support',
      icon: Headphones,
      isActive: pathname === '/support',
    },
    {
      label: 'Tickets',
      href: '/tickets',
      icon: Ticket,
      isActive: pathname.startsWith('/tickets'),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      isActive: pathname === '/settings',
    },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-60 bg-surface-container-lowest border-r border-white/10 flex flex-col py-stack-lg z-50 select-none">
      {/* Header / Brand */}
      <div className="px-6 mb-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary font-bold shadow-lg ai-glow group-hover:scale-105 transition-transform">
            <Bot className="size-5" />
          </div>
          <div>
            <h1 className="font-headline-md text-[17px] font-bold text-primary leading-tight">
              Concierge AI
            </h1>
            <p className="font-label-mono text-[11px] text-outline tracking-wider">
              Intelligent Co-pilot
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-95 ${
                item.isActive
                  ? 'bg-white/10 text-primary font-bold border-r-2 border-primary shadow-sm'
                  : 'text-on-surface-variant font-medium hover:bg-white/5 hover:text-on-surface'
              }`}
            >
              <Icon className={`size-4 ${item.isActive ? 'text-primary' : 'text-outline-variant'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="px-4 mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
        <Link
          href="/chat"
          className="w-full bg-gradient-to-r from-inverse-primary to-secondary-container text-white rounded-lg py-2.5 text-xs font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(73,75,214,0.3)] active:scale-95 mb-2"
        >
          <PlusCircle className="size-4" />
          <span>New Request</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors text-xs font-medium"
        >
          <HelpCircle className="size-4 text-outline" />
          <span>Support & SLA</span>
        </Link>

        <button
          onClick={() => setIsAuthOpen(true)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-white/5 transition-colors text-xs font-medium w-full text-start cursor-pointer"
        >
          <LogOut className="size-4 text-outline group-hover:text-error" />
          <span>Switch Identity ({activeProfile.name.split(' ')[0]})</span>
        </button>
      </div>
    </nav>
  );
}
