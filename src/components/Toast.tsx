import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="bg-[#11283c] border border-[#29465e] text-[#eef5fb] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium max-w-sm">
        {type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
        {type === 'error' && <AlertCircle size={16} className="text-rose-400 shrink-0" />}
        {type === 'info' && <Info size={16} className="text-blue-400 shrink-0" />}
        <span>{message}</span>
      </div>
    </div>
  );
};
