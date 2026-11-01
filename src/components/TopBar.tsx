import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  FileText,
  Eye,
  EyeOff,
  TrendingUp,
  LogOut,
  User as UserIcon,
  GraduationCap,
} from 'lucide-react';
import { NavView, AuthUser } from '../types';
import { formatMoney } from '../lib/formatters';

interface TopBarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  pendingTasksCount: number;
  todayEventsCount: number;
  pendingInvoicesCount?: number;
  isSupabaseConnected: boolean;
  isGcalConnected?: boolean;
  onSyncAll: () => void;
  isSyncing: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenModal: (type: 'task' | 'event' | 'finance' | 'client' | 'invoice' | 'course') => void;
  // Privacy and rich executive info
  isPrivacyMode: boolean;
  onTogglePrivacyMode: () => void;
  balance?: number;
  receivablesTotal?: number;
  // User Authentication
  user?: AuthUser | null;
  onSignOut?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onSelectView,
  pendingTasksCount,
  todayEventsCount,
  pendingInvoicesCount = 0,
  isSupabaseConnected,
  isGcalConnected = false,
  onSyncAll,
  isSyncing,
  searchQuery,
  onSearchChange,
  onOpenModal,
  isPrivacyMode,
  onTogglePrivacyMode,
  balance = 0,
  receivablesTotal = 0,
  user,
  onSignOut,
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

  const now = new Date();
  const greeting = useMemo(() => {
    const hours = now.getHours();
    if (hours >= 5 && hours < 12) return 'Bom dia';
    if (hours >= 12 && hours < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const todayText = useMemo(() => {
    return now.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

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
      id: 'invoices' as NavView,
      label: 'NF Emitida',
      icon: FileText,
      badge: pendingInvoicesCount && pendingInvoicesCount > 0 ? `${pendingInvoicesCount}` : undefined,
      badgeAlert: pendingInvoicesCount && pendingInvoicesCount > 0,
    },
    {
      id: 'work' as NavView,
      label: 'Trabalho / Clientes',
      icon: Briefcase,
    },
  ];

  return (
    <header className="bg-[#07121d]/95 backdrop-blur-md border-b border-[#142638] sticky top-0 z-30 px-3 sm:px-6 py-2.5 mb-4 shadow-lg transition-all">
      <div className="max-w-[1600px] mx-auto space-y-2.5">
        {/* Upper Row: Brand & Greeting | Executive Mini KPIs | Tools & Privacy */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Greeting */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#0c1d2d] border border-[#1d354b] px-2.5 py-1.5 rounded-lg shrink-0 shadow-xs">
              <span className="text-blue-500 font-black text-base leading-none">◢</span>
              <span className="font-black text-xs tracking-wider text-white">CENTRAL</span>
              <span className="text-[8px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v0.3
              </span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Central Kohari Family <span className="text-sm">👋</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#8194a8] capitalize font-medium flex items-center gap-1.5">
                <span className="text-cyan-400 font-semibold">{greeting}</span>
                <span className="text-[#2b4155]">•</span>
                <span>{todayText}</span>
              </p>
            </div>
          </div>

          {/* Center: Executive Quick Info Strip (enriching the field with high-value data) */}
          <div className="hidden lg:flex items-center gap-2 bg-[#091522] border border-[#193247] px-2.5 py-1 rounded-lg">
            {/* Quick Balance */}
            <div
              onClick={() => onSelectView('finance')}
              title="Clique para ir para Finanças"
              className="flex items-center gap-1.5 pr-2.5 border-r border-[#193247] cursor-pointer hover:opacity-80 transition-opacity"
            >
              <TrendingUp size={13} className={balance >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
              <div className="text-[10px]">
                <span className="text-[#6d849a] block font-medium leading-none">Saldo</span>
                <span className={`font-bold leading-tight ${balance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatMoney(balance, isPrivacyMode)}
                </span>
              </div>
            </div>

            {/* Quick Receivables */}
            <div
              onClick={() => onSelectView('invoices')}
              title="Clique para ver Notas Fiscais e Recebíveis"
              className="flex items-center gap-1.5 pr-2.5 border-r border-[#193247] cursor-pointer hover:opacity-80 transition-opacity"
            >
              <FileText size={13} className="text-amber-400" />
              <div className="text-[10px]">
                <span className="text-[#6d849a] block font-medium leading-none">A Receber</span>
                <span className="font-bold text-amber-300 leading-tight">
                  {formatMoney(receivablesTotal, isPrivacyMode)}
                </span>
              </div>
            </div>

            {/* Supabase status badge */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-[#193247] text-[10px] text-[#8194a8]">
              <Database size={11} className={isSupabaseConnected ? 'text-emerald-400' : 'text-amber-400'} />
              <span>{isSupabaseConnected ? 'Online' : 'Local'}</span>
            </div>

            {/* Google Agenda badge */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#8194a8]">
              <Cloud size={11} className={isGcalConnected ? 'text-blue-400' : 'text-[#647b91]'} />
              <span>{isGcalConnected ? 'Agenda Sync' : 'Agenda Off'}</span>
            </div>
          </div>

          {/* Right Tools: Privacy Button, Sync, Search, Add Dropdown */}
          <div className="flex items-center gap-2">
            {/* Privacy Mode Toggle Button (Direct requested feature) */}
            <button
              id="btn-toggle-privacy"
              onClick={onTogglePrivacyMode}
              title={
                isPrivacyMode
                  ? 'Modo Privacidade ativo (valores mascarados). Clique para mostrar valores.'
                  : 'Ocultar valores financeiros (Modo Privacidade)'
              }
              aria-label="Alternar visualização de valores financeiros"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPrivacyMode
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-xs shadow-amber-500/20 ring-1 ring-amber-500/30'
                  : 'bg-[#0a1622] hover:bg-[#12283c] border-[#1b3247] text-[#9bb0c4] hover:text-white'
              }`}
            >
              {isPrivacyMode ? (
                <EyeOff size={14} className="text-amber-400 shrink-0" />
              ) : (
                <Eye size={14} className="text-[#8194a8] shrink-0" />
              )}
              <span className="text-[11px] hidden sm:inline">
                {isPrivacyMode ? 'Valores Ocultos' : 'Ocultar Valores'}
              </span>
            </button>

            {/* Sync Button */}
            <button
              id="btn-sync-all-top"
              onClick={onSyncAll}
              disabled={isSyncing}
              title="Sincronizar todos os dados com Supabase e Google"
              className="px-2.5 py-1.5 rounded-lg bg-[#0a1622] hover:bg-[#12283c] text-[#9bb0c4] hover:text-white border border-[#1b3247] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
              <span className="text-[11px] hidden md:inline">{isSyncing ? 'Sincronizando...' : 'Atualizar'}</span>
            </button>

            {/* Search Bar */}
            <div className="relative w-36 sm:w-48 lg:w-60">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8194a8]" />
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar tarefas, finanças..."
                className="w-full pl-7 pr-3 py-1 bg-[#0a1622] border border-[#1b3247] rounded-lg text-xs text-[#dce7f2] placeholder-[#6f8498] focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8194a8] hover:text-white text-xs"
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
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-colors shrink-0 cursor-pointer"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Adicionar</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0a1622] border border-[#284258] rounded-xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
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

                  <button
                    id="btn-add-course-dropdown"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenModal('course');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#dce7f2] hover:bg-[#12304b] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <GraduationCap size={14} className="text-cyan-400" />
                    <span>Novo Curso / Treinamento</span>
                  </button>

                  <div className="my-1 border-t border-[#1a3147]" />

                  <button
                    id="btn-add-invoice-dropdown"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenModal('invoice');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#dce7f2] hover:bg-[#12304b] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileText size={14} className="text-cyan-400" />
                    <span>Nova NF Emitida</span>
                  </button>

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

            {/* User Account / Logout */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#193248]">
                  <div
                    title={`Conectado como: ${user.email} (${user.role || 'Admin'})`}
                    className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#07131f] border border-[#1b344c] text-[11px] text-[#a4bccc]"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-[10px]">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[110px] truncate font-medium text-white">
                      {user.name || user.email.split('@')[0]}
                    </span>
                  </div>

                  {onSignOut && (
                    <button
                      id="btn-logout"
                      type="button"
                      onClick={onSignOut}
                      title="Sair do aplicativo (Encerrar sessão)"
                      className="p-1.5 rounded-lg bg-[#0a1622] hover:bg-rose-950/40 text-[#8299b0] hover:text-rose-300 border border-[#1a3147] hover:border-rose-800/50 text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <LogOut size={13} />
                      <span className="text-[11px] hidden xl:inline">Sair</span>
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Navigation Tabs - Sleek, compact and scrollbar-hidden */}
        <nav className="flex items-center gap-1.5 pt-2 border-t border-[#142638] overflow-x-auto pb-0.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#12304b] text-white shadow-xs shadow-blue-500/20 border border-blue-500/40 ring-1 ring-blue-400/20'
                    : 'bg-[#0a1622]/80 text-[#9bb0c4] hover:bg-[#112437] hover:text-white border border-[#1b3043]'
                }`}
              >
                <Icon
                  size={14}
                  className={`transition-colors shrink-0 ${isActive ? 'text-blue-400' : 'text-[#8194a8]'}`}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
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
