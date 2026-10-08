'use client';

import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle2, Clock, X, ShoppingBag, Shield, RefreshCw } from 'lucide-react';
import type { CustomerProfile } from './CustomerAuthModal';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderData {
  orderId: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface AccountSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: CustomerProfile;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  shipped: { icon: <Truck size={13} />, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', label: 'Shipped' },
  delivered: { icon: <CheckCircle2 size={13} />, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', label: 'Delivered' },
  processing: { icon: <Clock size={13} />, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', label: 'Processing' },
  cancelled: { icon: <X size={13} />, color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40 text-rose-300', label: 'Cancelled' },
};

export default function AccountSidebar({ isOpen, onClose, activeProfile }: AccountSidebarProps) {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/orders?customerId=${encodeURIComponent(activeProfile.id)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      if (!silent) setError('Failed to load orders');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders(true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeProfile.id]);

  if (!isOpen) return null;

  const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.processing!;

  return (
    <div className="account-sidebar">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-indigo-400" />
          <h2 className="text-sm font-bold text-white tracking-tight">My Account</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Profile Summary */}
      <div className="px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 shadow">
            <AvatarFallback className={`bg-gradient-to-tr ${activeProfile.avatarColor} text-[10px] font-bold text-white`}>
              {activeProfile.name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{activeProfile.name}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{activeProfile.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <Badge variant="secondary" className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 text-[9px] font-bold py-0.5 gap-1">
            <Shield size={9} /> {activeProfile.tier}
          </Badge>
          <Badge variant="outline" className="bg-slate-800 text-slate-400 border border-white/5 text-[9px] font-mono py-0.5">
            Auth L{activeProfile.authLevel}
          </Badge>
        </div>
      </div>

      {/* Orders Section */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Package size={13} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Orders ({orders.length})
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchOrders()}
            className="h-6 w-6 text-slate-500 hover:text-slate-300 hover:bg-white/10 rounded cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>

        {loading && orders.length === 0 && (
          <div className="px-4 py-8 text-center">
            <RefreshCw size={20} className="animate-spin text-indigo-400 mx-auto mb-2" />
            <p className="text-[11px] text-slate-500">Loading orders...</p>
          </div>
        )}

        {error && (
          <div className="px-4 py-3">
            <p className="text-[11px] text-rose-400">{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="px-4 py-8 text-center">
            <Package size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-[11px] text-slate-500">No orders found</p>
          </div>
        )}

        <div className="space-y-1.5 px-3 pb-4">
          {orders.map((order) => {
            const config = getStatusConfig(order.status);
            return (
              <div
                key={order.orderId}
                className="group p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-default"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white font-mono">{order.orderId}</span>
                  <Badge variant="outline" className={`${config.bg} ${config.color} text-[9px] font-bold py-0.5 gap-1`}>
                    {config.icon}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                {order.carrier && (
                  <p className="text-[10px] text-slate-400">
                    <Truck size={10} className="inline mr-1 -mt-0.5" />
                    {order.carrier}
                    {order.trackingNumber && <span className="text-slate-500 ml-1">#{order.trackingNumber.slice(0, 12)}</span>}
                  </p>
                )}
                {order.estimatedDelivery && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Est. delivery: <span className="text-slate-400">{order.estimatedDelivery}</span>
                  </p>
                )}
                {order.deliveredAt && (
                  <p className="text-[10px] text-emerald-500/70 mt-0.5">
                    Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="px-4 py-3 border-t border-white/8 text-center">
        <p className="text-[9px] text-slate-600 font-mono">
          ID: {activeProfile.id} • {orders.length} order{orders.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
