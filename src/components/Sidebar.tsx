import React from 'react';
import { Home, Calendar, CheckSquare, DollarSign, Briefcase, Database, Cloud, RefreshCw } from 'lucide-react';
import { NavView } from '../types';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  pendingTasksCount: number;
  todayEventsCount: number;
  isSupabaseConnected: boolean;
  isGcalConnected: boolean;
  onSyncAll: () => void;
  isSyncing: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  pendingTasksCount,
  todayEventsCount,
  isSupabaseConnected,
  isGcalConnected,
  onSyncAll,
  isSyncing,
  mobileOpen = false,
  onCloseMobile,
}) => {
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
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-150"
        />
      )}

      <aside
        id="sidebar-container"
        className={`fixed md:sticky top-0 h-screen w-64 bg-[#07111b] border-r border-[#142638] flex flex-col shrink-0 z-40 md:z-20 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Logo */}
        <div className="p-5 pb-6 border-b border-[#142638]/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500 font-black text-xl tracking-tight">◢</span>
              <span className="font-extrabold text-xl tracking-wider text-white">CENTRAL</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v0.3
              </span>
            </div>
            <p className="text-xs font-bold text-cyan-400 mt-1 tracking-wide">Central Kohari Family</p>
            <p className="text-[11px] text-[#8194a8] mt-0.5 font-medium">Produtividade & Finanças</p>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-[#8194a8] hover:text-white hover:bg-[#12273b]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => {
                  onSelectView(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#12304b] text-white shadow-sm shadow-blue-500/10 border border-blue-500/30'
                    : 'text-[#9bb0c4] hover:bg-[#0c1c2a] hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={17}
                    className={`transition-colors ${
                      isActive ? 'text-blue-400' : 'text-[#8194a8] group-hover:text-blue-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
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

        {/* Cloud Status Footer */}
        <div className="p-3.5 mx-3 mb-4 rounded-xl bg-[#0a1622] border border-[#183147] text-[11px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8093a7] font-medium flex items-center gap-1.5">
              <Database size={12} className={isSupabaseConnected ? 'text-emerald-400' : 'text-amber-400'} />
              Supabase
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isSupabaseConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {isSupabaseConnected ? 'Online' : 'Local Cache'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#8093a7] font-medium flex items-center gap-1.5">
              <Cloud size={12} className={isGcalConnected ? 'text-blue-400' : 'text-[#647b91]'} />
              Google Agenda
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isGcalConnected ? 'bg-blue-500/20 text-blue-300' : 'bg-[#122334] text-[#8194a8]'
              }`}
            >
              {isGcalConnected ? 'Sincronizado' : 'Offline'}
            </span>
          </div>

          <button
            id="btn-sync-all-sidebar"
            onClick={onSyncAll}
            disabled={isSyncing}
            className="w-full mt-2 py-1.5 px-2.5 rounded-md bg-[#102233] hover:bg-[#16304a] text-[#b8cbe0] border border-[#28445b] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
            {isSyncing ? 'Sincronizando...' : 'Atualizar Dados'}
          </button>
        </div>
      </aside>
    </>
  );
};
