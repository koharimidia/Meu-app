import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Database,
  Building,
  Cloud,
  Laptop,
  Smartphone,
} from 'lucide-react';
import { AuthUser } from '../types';
import { signInUser, signUpUser, triggerGoogleSignIn } from '../lib/auth';

interface AuthViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('koharimidia@gmail.com');
  const [password, setPassword] = useState('kohari2026');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('Gabriel Kohari');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem. Digite a mesma senha nos dois campos.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await signInUser(email, password);
        if (result.error) {
          setErrorMsg(result.error);
        } else if (result.user) {
          setSuccessMsg('Login realizado com sucesso! Carregando aplicativo...');
          setTimeout(() => {
            onLoginSuccess(result.user!);
          }, 350);
        }
      } else {
        const result = await signUpUser(email, password, name);
        if (result.error) {
          setErrorMsg(result.error);
        } else if (result.user) {
          setSuccessMsg(result.message || 'Conta criada com sucesso! Entrando...');
          setTimeout(() => {
            onLoginSuccess(result.user!);
          }, 450);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocorreu um erro ao processar sua autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    triggerGoogleSignIn(
      (user) => {
        setIsLoading(false);
        setSuccessMsg(`Conectado com o Google (${user.email})! Carregando aplicativo...`);
        setTimeout(() => {
          onLoginSuccess(user);
        }, 350);
      },
      (err) => {
        setIsLoading(false);
        setErrorMsg(err || 'Não foi possível conectar com o Google no momento.');
      }
    );
  };

  const handleQuickDemoAdmin = () => {
    setEmail('koharimidia@gmail.com');
    setPassword('kohari2026');
    setName('Gabriel Kohari');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#04080e] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[250px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 shadow-lg shadow-blue-500/25 border border-blue-400/30 mb-3">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Central Kohari Family
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-medium">
              Acesso Seguro
            </span>
          </h1>
          <p className="text-xs text-[#8ca4bd] mt-1.5">
            Conecte-se com sua conta Google ou credenciais para acessar e sincronizar em qualquer dispositivo
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-[#091522]/95 border border-[#18314a] rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative">
          {/* Google Sign-In Primary Button */}
          <div className="mb-5">
            <button
              id="btn-google-sign-in"
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-slate-200 active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Entrar com a Conta Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-[#18324a] w-full" />
            <span className="bg-[#091522] px-3 text-[10px] uppercase tracking-wider text-[#68819a] font-medium absolute">
              ou com e-mail e senha
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#050c14] rounded-xl border border-[#13273c] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-[#8299b0] hover:text-[#d0e0f0]'
              }`}
            >
              Entrar no App
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setConfirmPassword(password);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-[#8299b0] hover:text-[#d0e0f0]'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <div className="leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-[#a1b8cf] mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#607994]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#050c14] border border-[#1b344d] rounded-xl text-xs text-white placeholder-[#506780] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#a1b8cf] mb-1.5">
                E-mail ou Usuário
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#607994]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#050c14] border border-[#1b344d] rounded-xl text-xs text-white placeholder-[#506780] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#a1b8cf]">
                  Senha
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      alert('Para redefinir sua senha, você pode usar a senha padrão de recuperação ou criar uma nova conta.');
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#607994]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#050c14] border border-[#1b344d] rounded-xl text-xs text-white placeholder-[#506780] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#607994] hover:text-[#b4c8dc] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-[#a1b8cf] mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#607994]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#050c14] border border-[#1b344d] rounded-xl text-xs text-white placeholder-[#506780] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#8ca4bd]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#1b344d] bg-[#050c14] text-blue-500 focus:ring-0 cursor-pointer"
                />
                <span>Lembrar de mim</span>
              </label>

              {/* Quick autofill for Kohari admin */}
              <button
                type="button"
                onClick={handleQuickDemoAdmin}
                className="text-[11px] text-[#718aa3] hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
                title="Preencher credenciais padrão"
              >
                <Sparkles size={11} className="text-cyan-400" />
                <span>Preencher admin</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={15} />
                </>
              ) : (
                <>
                  <span>Criar Conta e Acessar</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Security & Database Status Footer */}
          <div className="mt-6 pt-4 border-t border-[#13273c] flex items-center justify-between text-[11px] text-[#637d97]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Cloud size={12} />
              <span>Nuvem Conectada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-blue-400" />
              <span>Sessão Protegida</span>
            </div>
          </div>
        </div>

        {/* Multi-Device Synchronized Banner */}
        <div className="mt-4 p-3.5 bg-[#07131f]/90 border border-[#173048] rounded-xl text-xs text-[#8299b0] leading-relaxed flex items-start gap-3 shadow-lg">
          <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-400 shrink-0 mt-0.5">
            <Cloud size={16} />
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
              <span>Sincronização em Tempo Real</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                Multi-Dispositivos
              </span>
            </div>
            <p className="text-[11px] text-[#8aa1b7]">
              Ao abrir o link no seu celular, tablet ou em qualquer outro computador com sua conta Google, todos os lançamentos, cursos, tarefas e relatórios são carregados automaticamente atualizados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
