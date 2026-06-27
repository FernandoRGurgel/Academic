'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface DashboardTabsProps {
  activeTab: 'painel' | 'agenda';
}

export function DashboardTabs({ activeTab }: DashboardTabsProps) {
  return (
    <div className="flex gap-6 border-b border-outline-variant mb-12">
      <Link
        href="/"
        className={`pb-3 px-2 font-sans text-sm font-semibold transition-colors border-b-2 ${
          activeTab === 'painel'
            ? 'border-primary text-primary'
            : 'border-transparent text-on-surface-variant hover:text-primary'
        }`}
      >
        Painel
      </Link>
      <Link
        href="/agenda"
        className={`pb-3 px-2 font-sans text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
          activeTab === 'agenda'
            ? 'border-primary text-primary'
            : 'border-transparent text-on-surface-variant hover:text-primary'
        }`}
      >
        <Calendar className="w-4 h-4" /> Agenda
      </Link>
    </div>
  );
}
