import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Folder,
  FileText,
  Sparkles,
  Loader2,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
} from 'lucide-react';
import {
  DriveFile,
  isGoogleDriveConnected,
  requestGoogleDriveAuth,
  disconnectGoogleDrive,
  findDriveFolder,
  listDrivePdfFiles,
  importInvoiceFromDrive,
} from '../lib/googleDrive';
import { ExtractedInvoiceData } from '../lib/invoiceReader';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceExtracted: (data: ExtractedInvoiceData, driveFile: DriveFile) => void;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onInvoiceExtracted,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'nf-app' | 'all'>('nf-app');
  const [nfAppFolder, setNfAppFolder] = useState<{ id: string; name: string } | null>(null);
  const [selectedFileProcessing, setSelectedFileProcessing] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSelectedFileProcessing(null);
      return;
    }

    const connected = isGoogleDriveConnected();
    setIsConnected(connected);

    if (connected) {
      loadDriveContent();
    }
  }, [isOpen]);

  const loadDriveContent = async (overrideToken?: string) => {
    try {
      setIsLoadingFiles(true);
      setErrorMsg(null);

      // Check if folder "nf-app" exists in user's Drive
      let folder = nfAppFolder;
      if (!folder) {
        try {
          folder = await findDriveFolder('nf-app', overrideToken);
          setNfAppFolder(folder);
        } catch (e) {
          console.warn('Busca pela pasta nf-app:', e);
        }
      }

      const targetFolderId = activeTab === 'nf-app' && folder ? folder.id : undefined;

      const driveFiles = await listDrivePdfFiles({
        folderId: targetFolderId,
        search: searchQuery,
        token: overrideToken,
      });

      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Erro ao carregar arquivos do Drive:', err);
      if (String(err?.message || '').includes('401') || String(err?.message || '').includes('autenticação')) {
        setIsConnected(false);
        disconnectGoogleDrive();
      }
      setErrorMsg(err?.message || 'Falha ao buscar arquivos no Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoadingAuth(true);
      setErrorMsg(null);
      const token = await requestGoogleDriveAuth();
      setIsConnected(true);
      await loadDriveContent(token);
    } catch (err: any) {
      console.error('Erro ao conectar Google Drive:', err);
      setErrorMsg(err?.message || 'Não foi possível conectar ao Google Drive.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleDrive();
    setIsConnected(false);
    setFiles([]);
    setNfAppFolder(null);
  };

  const handleTabChange = (tab: 'nf-app' | 'all') => {
    setActiveTab(tab);
    setTimeout(() => {
      loadDriveContent();
    }, 50);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDriveContent();
  };

  const handleImportFile = async (file: DriveFile) => {
    try {
      setSelectedFileProcessing(file.id);
      setErrorMsg(null);
      setSuccessMsg(`Baixando e lendo ${file.name}...`);

      const result = await importInvoiceFromDrive(file);

      setSuccessMsg(`Nota lida com sucesso! Preenchendo campos...`);
      setTimeout(() => {
        onInvoiceExtracted(result.invoiceData, file);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Erro ao importar arquivo do Google Drive:', err);
      setErrorMsg(err?.message || 'Falha ao extrair os dados do arquivo selecionado.');
    } finally {
      setSelectedFileProcessing(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-gdrive-picker"
        className="w-full max-w-2xl bg-[#08131e] border border-[#142638] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#142638] flex items-center justify-between bg-[#06101a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-cyan-400">
              <HardDrive size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Google Drive • Notas Fiscais
                </h3>
                {isConnected && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Conectado
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8194a8]">
                Selecione as NFs diretamente da pasta <span className="text-cyan-300 font-mono">nf-app</span> ou do seu Google Drive.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8194a8] hover:text-white hover:bg-[#102336] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-white text-xs px-1"
            >
              ×
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {!isConnected ? (
            /* Connect Call to Action */
            <div className="p-8 rounded-2xl bg-[#091826] border border-[#142638] text-center space-y-4 my-2">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
                <HardDrive size={32} />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="text-base font-bold text-white">
                  Conectar sua conta Google
                </h4>
                <p className="text-xs text-[#8194a8] leading-relaxed">
                  Permita o acesso em modo somente-leitura aos PDFs do seu Google Drive para buscar e ler suas notas fiscais automaticamente da pasta <strong className="text-cyan-300">nf-app</strong>.
                </p>
              </div>

              <button
                onClick={handleConnect}
                disabled={isLoadingAuth}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {isLoadingAuth ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Conectando ao Google...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Autorizar Google Drive</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Connected Content */
            <>
              {/* Folder info & Actions Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-[#06101a] border border-[#142638] rounded-xl text-xs">
                  <button
                    onClick={() => handleTabChange('nf-app')}
                    className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                      activeTab === 'nf-app'
                        ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                        : 'text-[#8194a8] hover:text-white'
                    }`}
                  >
                    <Folder size={14} className={nfAppFolder ? 'text-cyan-400' : 'text-[#8194a8]'} />
                    <span>Pasta nf-app</span>
                    {nfAppFolder && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    )}
                  </button>

                  <button
                    onClick={() => handleTabChange('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                      activeTab === 'all'
                        ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                        : 'text-[#8194a8] hover:text-white'
                    }`}
                  >
                    <FileText size={14} />
                    <span>Todos os PDFs</span>
                  </button>
                </div>

                {/* Search & Refresh */}
                <div className="flex items-center gap-2">
                  <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-56">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8194a8]" />
                    <input
                      type="text"
                      placeholder="Buscar por nome da NF..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#06101a] border border-[#142638] text-xs text-white placeholder-[#51687f] focus:outline-none focus:border-cyan-500/50"
                    />
                  </form>

                  <button
                    onClick={() => loadDriveContent()}
                    disabled={isLoadingFiles}
                    title="Atualizar lista"
                    className="p-2 rounded-lg bg-[#06101a] border border-[#142638] text-[#8194a8] hover:text-white hover:border-cyan-500/40 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isLoadingFiles ? 'animate-spin text-cyan-400' : ''} />
                  </button>

                  <button
                    onClick={handleDisconnect}
                    title="Desconectar conta"
                    className="p-2 rounded-lg bg-[#06101a] border border-[#142638] text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>

              {/* Folder indicator reminder */}
              {activeTab === 'nf-app' && !nfAppFolder && !isLoadingFiles && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                  <span>Pasta <strong className="font-mono">nf-app</strong> não encontrada na raiz. Mostrando todos os PDFs do Drive.</span>
                  <button
                    onClick={() => handleTabChange('all')}
                    className="underline hover:text-white text-[11px]"
                  >
                    Ver todos
                  </button>
                </div>
              )}

              {/* Files List */}
              <div className="space-y-2 min-h-[220px]">
                {isLoadingFiles ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#8194a8] space-y-2">
                    <Loader2 size={28} className="animate-spin text-cyan-400" />
                    <p className="text-xs">Buscando notas fiscais no seu Google Drive...</p>
                  </div>
                ) : files.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-[#1f384f] text-center space-y-2 text-[#8194a8]">
                    <FileText size={28} className="mx-auto opacity-50" />
                    <p className="text-xs font-medium text-white">Nenhum PDF encontrado</p>
                    <p className="text-[11px] max-w-sm mx-auto">
                      {activeTab === 'nf-app'
                        ? 'Não encontramos arquivos PDF na pasta nf-app. Verifique se os arquivos já foram carregados ou clique em "Todos os PDFs".'
                        : 'Nenhum documento PDF foi retornado pela busca no seu Drive.'}
                    </p>
                  </div>
                ) : (
                  files.map((file) => {
                    const isProcessing = selectedFileProcessing === file.id;

                    return (
                      <div
                        key={file.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isProcessing
                            ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                            : 'bg-[#091929] border-[#142638] hover:border-cyan-500/30 hover:bg-[#0c2033]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-white truncate" title={file.name}>
                                {file.name}
                              </p>
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Ver arquivo no Google Drive"
                                  className="text-[#8194a8] hover:text-cyan-400 transition-colors"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#8194a8] mt-0.5">
                              {file.size && <span>{formatFileSize(file.size)}</span>}
                              {file.size && file.modifiedTime && <span>•</span>}
                              {file.modifiedTime && <span>{formatDate(file.modifiedTime)}</span>}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleImportFile(file)}
                          disabled={isProcessing}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 shadow-sm disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Lendo NF...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={13} className="text-cyan-200" />
                              <span>Importar & Ler</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#142638] bg-[#06101a] flex items-center justify-between text-xs text-[#8194a8]">
          <span>
            {isConnected ? `${files.length} arquivo(s) disponível(is)` : 'Google Drive não conectado'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#102336] hover:bg-[#16314c] text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
