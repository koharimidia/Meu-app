import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  CheckSquare,
  Calendar,
  DollarSign,
  Briefcase,
  Home,
  Database,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { NavView } from '../types';

interface TopBarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  pendingTasksCount: number;
  todayEventsCount: number;
  isSupabaseConnected: boolean;
  isGcalConnected?: boolean;
  onSyncAll: () => void;
  isSyncing: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenModal: (type: 'task' | 'event' | 'finance' | 'client') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onSelectView,
  pendingTasksCount,
  todayEventsCount,
  isSupabaseConnected,
  isGcalConnected = false,
  onSyncAll,
  isSyncing,
  searchQuery,
  onSearchChange,
  onOpenModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayText = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const navItems = [
    {
      id: 'home' as NavView,
      label: 'Hoje',
      icon: Home,
      badge: todayEventsCount > 0 ? `${todayEventsCount} eventos` : undefined,
    },
    {
      id: 'agenda' as NavView,
      label: 'Agenda',
      icon: Calendar,
      badge: isGcalConnected ? 'Google Sync' : undefined,
    },
    {
      id: 'tasks' as NavView,
      label: 'Tarefas',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : undefined,
      badgeAlert: pendingTasksCount > 0,
    },
    {
      id: 'finance' as NavView,
      label: 'Finanças',
      icon: DollarSign,
    },
    {
      id: 'work' as NavView,
      label: 'Trabalho / Clientes',
      icon: Briefcase,
    },
  ];

  return (
    <header className="bg-[#07121d]/95 backdrop-blur-md border-b border-[#142638] sticky top-0 z-30 px-4 md:px-7 py-3.5 mb-6">
      <div className="max-w-[1600px] mx-auto space-y-3.5">
        {/* Upper Row: Brand & Title on left | Status, Search & Add on right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Brand & Central Kohari Family */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex items-center gap-2 bg-[#0c1d2d] border border-[#1d354b] px-3 py-2 rounded-xl shrink-0 shadow-xs">
              <span className="text-blue-500 font-black text-lg leading-none">◢</span>
              <span className="font-black text-sm tracking-wider text-white">CENTRAL</span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v0.3
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Central Kohari Family <span className="text-lg sm:text-xl">👋</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-[#8194a8] capitalize mt-0.5 font-medium flex items-center gap-2">
                <span>{todayText}</span>
                <span className="text-[#2b4155] hidden sm:inline">•</span>
                <span className="text-cyan-400 font-semibold hidden sm:inline">Produtividade & Finanças</span>
              </p>
            </div>
          </div>

          {/* Right Tools: Status, Sync, Search, Add Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Supabase Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0a1622] border border-[#1b3247] text-xs">
              <Database size={13} className={isSupabaseConnected ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="text-[#8194a8] text-[11px] hidden sm:inline">Supabase:</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isSupabaseConnected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
                }`}
              >
                {isSupabaseConnected ? 'Online' : 'Local Cache'}
              </span>
            </div>

            {/* Google Agenda Status */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0a1622] border border-[#1b3247] text-xs">
              <Cloud size={13} className={isGcalConnected ? 'text-blue-400' : 'text-[#647b91]'} />
              <span className="text-[#8194a8] text-[11px]">Agenda:</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isGcalConnected ? 'bg-blue-500/15 text-blue-300' : 'bg-[#122334] text-[#8194a8]'
                }`}
              >
                {isGcalConnected ? 'Sync' : 'Offline'}
              </span>
            </div>

            {/* Sync Button */}
            <button
              id="btn-sync-all-top"
              onClick={onSyncAll}
              disabled={isSyncing}
              title="Sincronizar todos os dados com Supabase e Google"
              className="px-2.5 py-1.5 rounded-lg bg-[#0a1622] hover:bg-[#12283c] text-[#9bb0c4] hover:text-white border border-[#1b3247] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
              <span className="text-[11px] hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Atualizar Dados'}</span>
            </button>

            {/* Search Bar */}
            <div className="relative w-48 sm:w-60 lg:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8194a8]" />
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar tarefas, agenda, finanças..."
                className="w-full pl-8 pr-4 py-1.5 bg-[#0a1622] border border-[#1b3247] rounded-lg text-xs text-[#dce7f2] placeholder-[#6f8498] focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8194a8] hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Add Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="btn-main-add"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-colors shrink-0 cursor-pointer"
              >
                <Plus size={15} />
                <span>Adicionar</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0a1622] border border-[#284258] rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    id="btn-add-task-dropdown"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenModal('task');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#dce7f2] hover:bg-[#12304b] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <CheckSquare size={14} className="text-blue-400" />
                    <span>Nova Tarefa</span>
                  </button>

                  <button
                    id="btn-add-event-dropdown"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenModal('event');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#dce7f2] hover:bg-[#12304b] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Calendar size={14} className="text-amber-400" />
                    <span>Novo Compromisso</span>
                  </button>

                  <button
                    id="btn-add-finance-dropdown"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenModal('finance');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#dce7f2] hover:bg-[#12304b] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <DollarSign size={14} className="text-emerald-400" />
                    <span>Lançamento Financeiro</span>
                  </button>

                  <div className="my-1 border-t border-[#1a3147]" />

                  <button
                    id="btn-add-client-dropdown"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenModal('client');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#dce7f2] hover:bg-[#12304b] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Briefcase size={14} className="text-purple-400" />
                    <span>Novo Cliente / Projeto</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Row - EXACTLY BELOW "Central Kohari Family" */}
        <nav className="flex items-center gap-2 pt-2.5 border-t border-[#142638] overflow-x-auto pb-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#12304b] text-white shadow-sm shadow-blue-500/20 border border-blue-500/40 ring-1 ring-blue-400/20'
                    : 'bg-[#0a1622]/80 text-[#9bb0c4] hover:bg-[#112437] hover:text-white border border-[#1b3043]'
                }`}
              >
                <Icon
                  size={15}
                  className={`transition-colors ${isActive ? 'text-blue-400' : 'text-[#8194a8]'}`}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      item.badgeAlert
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-[#142d44] text-blue-300 border border-blue-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
