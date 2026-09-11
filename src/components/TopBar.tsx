import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, CheckSquare, Calendar, DollarSign, Briefcase, Menu } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenModal: (type: 'task' | 'event' | 'finance' | 'client') => void;
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenModal,
  onToggleMobileMenu,
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

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#142638]/50">
      {/* Title & Date */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg bg-[#0b1a29] border border-[#20374b] text-[#8194a8] hover:text-white transition-colors"
            title="Menu"
          >
            <Menu size={18} />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Central Kohari Family <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs text-[#8194a8] capitalize mt-0.5 font-medium">{todayText}</p>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        {/* Search Bar */}
        <div className="relative flex-1 md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8194a8]" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar tarefas, agenda, finanças, clientes..."
            className="w-full pl-9 pr-4 py-2 bg-[#0b1a29] border border-[#20374b] rounded-lg text-xs text-[#dce7f2] placeholder-[#6f8498] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8194a8] hover:text-white text-xs px-1"
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
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-colors shrink-0"
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
                className="w-full text-left px-3.5 py-2 text-xs text-[#dce7f2] hover:bg-[#12304b] flex items-center gap-2.5 transition-colors"
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
                className="w-full text-left px-3.5 py-2 text-xs text-[#dce7f2] hover:bg-[#12304b] flex items-center gap-2.5 transition-colors"
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
                className="w-full text-left px-3.5 py-2 text-xs text-[#dce7f2] hover:bg-[#12304b] flex items-center gap-2.5 transition-colors"
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
                className="w-full text-left px-3.5 py-2 text-xs text-[#dce7f2] hover:bg-[#12304b] flex items-center gap-2.5 transition-colors"
              >
                <Briefcase size={14} className="text-purple-400" />
                <span>Novo Cliente / Projeto</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
