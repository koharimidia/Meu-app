import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Quote,
  Settings,
  ExternalLink,
  X,
  Radio,
  Globe,
} from 'lucide-react';
import {
  MotivationalMessage,
  getDailyQuoteForDate,
  syncNextMotivationalQuote,
  getCustomFeedUrl,
  setCustomFeedUrl,
} from '../lib/motivationalQuotes';
import { todayISO } from '../lib/formatters';

export const DailyMotivationBanner: React.FC = () => {
  const [quoteData, setQuoteData] = useState<MotivationalMessage>(() => {
    return getDailyQuoteForDate(todayISO());
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [feedUrlInput, setFeedUrlInput] = useState(getCustomFeedUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Refresh date if changed
    const today = todayISO();
    setQuoteData(getDailyQuoteForDate(today));
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const next = await syncNextMotivationalQuote();
      setQuoteData(next);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`"${quoteData.quote}" — ${quoteData.author}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveFeed = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomFeedUrl(feedUrlInput);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowConfigModal(false);
      handleSync();
    }, 900);
  };

  return (
    <>
      {/* Coluna única com 3 linhas para mensagens positivas e motivacionais */}
      <div className="w-full bg-gradient-to-r from-[#0a1829] via-[#0d2238] to-[#0a1829] border border-[#1d3c59]/80 rounded-xl p-3.5 sm:px-5 sm:py-3.5 shadow-lg relative overflow-hidden transition-all group">
        {/* Glow ambient background accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col justify-between gap-1.5 relative z-10">
          {/* LINHA 1: Cabeçalho com contexto, categoria e ações de sincronização */}
          <div className="flex items-center justify-between gap-2 border-b border-[#162d42]/70 pb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                <Sparkles size={14} className="animate-pulse" />
              </span>
              <span className="text-xs font-bold text-white tracking-wide truncate">
                Mensagem Positiva do Dia
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/25 shrink-0 hidden sm:inline">
                {quoteData.category}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                title="Sincronizar / Buscar nova mensagem motivacional"
                className="px-2 py-1 rounded-lg bg-[#0e2236] hover:bg-[#163350] border border-[#203f60] text-blue-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                title="Copiar mensagem para a área de transferência"
                className="p-1 text-[#8297ab] hover:text-white rounded-lg bg-[#0e2236] hover:bg-[#163350] border border-[#203f60] text-[11px] transition-colors cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>

              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                title="Configurar site ou feed de mensagens positivas"
                className="p-1 text-[#8297ab] hover:text-white rounded-lg bg-[#0e2236] hover:bg-[#163350] border border-[#203f60] text-[11px] transition-colors cursor-pointer"
              >
                <Settings size={13} />
              </button>
            </div>
          </div>

          {/* LINHA 2: A frase motivacional em destaque legível e inspiradora */}
          <div className="py-1 flex items-start gap-2.5">
            <Quote size={18} className="text-blue-400/70 shrink-0 mt-0.5 rotate-180" />
            <p className="text-xs sm:text-[13px] font-medium text-[#edf4fb] italic leading-relaxed line-clamp-2 select-text">
              "{quoteData.quote}"
            </p>
          </div>

          {/* LINHA 3: Autor, fonte da mensagem e indicador de sincronização */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#162d42]/60 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-300/90 tracking-wide">
                — {quoteData.author}
              </span>
              <span className="text-[#657d94]">•</span>
              <span className="text-[#8ba0b5] text-[10px]">
                {quoteData.source || 'Feed Diário Central Kohari'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Feed Sincronizado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Configuração de Site / Feed de Mensagens */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#091522] border border-[#1e3952] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-[#eef5fb]">
            <div className="flex items-center justify-between border-b border-[#162d42] pb-3">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-400" />
                <h3 className="text-sm font-bold text-white">Sincronizar Feed de Mensagens</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-[#8296aa] hover:text-white rounded-lg hover:bg-[#12263a] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveFeed} className="space-y-3.5 text-xs">
              <p className="text-[#9cb0c3] leading-relaxed">
                Você pode integrar uma URL de API pública ou site de mensagens motivacionais (formato JSON ou REST) para puxar novas frases diariamente.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-[#cbd8e6] mb-1">
                  URL da API ou Site de Frases (Opcional):
                </label>
                <input
                  type="url"
                  placeholder="Ex: https://api.adviceslip.com/advice"
                  value={feedUrlInput}
                  onChange={(e) => setFeedUrlInput(e.target.value)}
                  className="w-full bg-[#060e17] border border-[#213a52] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[10px] text-[#718699] mt-1 block">
                  Se deixado em branco, o sistema sincroniza a curadoria diária com frases de foco, persistência e família.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-200 space-y-1">
                <span className="font-semibold block text-white">✨ Fontes Públicas Suportadas:</span>
                <p>• Advice Slip API (`https://api.adviceslip.com/advice`)</p>
                <p>• Curadoria local Central Kohari (Foco, Família & Sucesso)</p>
              </div>

              {savedSuccess && (
                <div className="p-2 rounded bg-emerald-500/20 text-emerald-300 text-center font-bold text-xs border border-emerald-500/40">
                  Configuração salva com sucesso! Sincronizando...
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#162d42]">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#112437] hover:bg-[#18344e] text-[#a4bbd1] text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-md shadow-blue-600/20"
                >
                  Salvar e Sincronizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
