'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Database,
  Layers,
  Share2,
  Server,
  ShieldCheck,
  LogOut,
  Activity,
  Zap,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { label: 'KV Query Workbench', href: '/dashboard', icon: Database },
    { label: 'LSM-Tree & SSTables', href: '/dashboard/lsm', icon: Layers },
    { label: 'Consistent Hash Ring', href: '/dashboard/ring', icon: Share2 },
    { label: 'Raft Consensus Cluster', href: '/dashboard/cluster', icon: Server },
    { label: 'Keyspace Security & OPA', href: '/dashboard/security', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#080c16] flex flex-col md:flex-row text-slate-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-slate-800/80 bg-slate-950/60 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Logo & Health Pill */}
          <div>
            <Link href="/dashboard" className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/25">
                <Database className="w-4 h-4 text-slate-950 font-bold" />
              </div>
              <span className="font-bold text-lg text-white">ApexCache</span>
            </Link>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LSM Ring: 5 Nodes (0.42ms P99)
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="px-2">
            <div className="text-xs font-medium text-white truncate">{user?.name || 'Storage Engineer'}</div>
            <div className="text-[10px] text-slate-400 truncate">{user?.email || 'engineer@apexcache.io'}</div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 text-xs transition-all border border-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
