'use client';

import React, { useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import AccountSidebar from '../components/AccountSidebar';
import { useCustomer } from '../components/CustomerContext';
import { PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ChatPage() {
  const { activeProfile, setIsAuthOpen } = useCustomer();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
      {/* Main Chat Frame */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 overflow-hidden">
        {/* Chat Top Action Bar */}
        <div className="flex items-center justify-between pb-3 mb-1 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-on-surface">
              Live Agent Session ({activeProfile.name})
            </span>
            <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/20 text-primary font-mono py-0 px-2">
              {activeProfile.tier}
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high border-white/10 text-xs text-on-surface rounded-lg transition-all h-8 px-3 cursor-pointer"
          >
            <PanelRightOpen className="size-3.5 text-primary" />
            <span className="font-medium">Order History</span>
          </Button>
        </div>

        {/* Interactive Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            activeProfile={activeProfile}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        </div>
      </div>

      {/* Account Orders Drawer */}
      <AccountSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeProfile={activeProfile}
      />
    </div>
  );
}
