import React, { useState } from 'react';
import { X, Sparkles, UserPlus, ArrowRight, Search, Compass, Check, Users, Hash, Volume2 } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import clsx from 'clsx';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'create' | 'join';
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({ 
  isOpen, 
  onClose,
  initialMode = 'create' 
}) => {
  const { user } = useAuthStore();
  const { createServer, joinServerByCode, publicDirectory, servers } = useServerStore();
  const [mode, setMode] = useState<'create' | 'join'>(initialMode);
  const [serverName, setServerName] = useState(`${user?.name || 'My'}'s Guild`);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) {
      setError('Please enter a server name');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await createServer(serverName.trim());
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinServer = async (codeOrName: string) => {
    if (!codeOrName.trim()) {
      setError('Please enter a server name or code');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await joinServerByCode(codeOrName.trim());
      onClose();
    } catch (err: any) {
      setError('Could not join server');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter public directory by search query
  const query = searchQuery.trim().toLowerCase();
  const filteredDirectory = publicDirectory.filter((s) => {
    if (!query) return true;
    return (
      s.name.toLowerCase().includes(query) ||
      (s.inviteCode && s.inviteCode.toLowerCase().includes(query)) ||
      s.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-lg bg-[#0E121B] text-[#dbdee1] rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/30 transform transition-all animate-scale-up max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Tab Header: Create vs Discover & Join */}
        <div className="flex border-b border-[#181D2A] bg-[#0A0D14] shrink-0">
          <button
            onClick={() => { setMode('create'); setError(null); }}
            className={clsx(
              "flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2",
              mode === 'create'
                ? "border-pink-400 text-pink-400 bg-[#0E121B]"
                : "border-transparent text-gray-400 hover:text-white"
            )}
          >
            <Sparkles size={14} />
            <span>Create a Server</span>
          </button>
          
          <button
            onClick={() => { setMode('join'); setError(null); }}
            className={clsx(
              "flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2",
              mode === 'join'
                ? "border-cyan-400 text-cyan-400 bg-[#0E121B]"
                : "border-transparent text-gray-400 hover:text-white"
            )}
          >
            <Compass size={14} />
            <span>Discover & Join Servers</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {mode === 'create' ? (
            /* ──────── CREATE SERVER FORM ──────── */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-pink-500/10">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Create Your Server</h2>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Your server is where you and your friends hang out. Name it and invite your squad!
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-pink-400 mb-2">
                  Server Name
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="e.g. Gaming Squad or Anime Guild"
                  className="w-full bg-[#07090E] text-white px-4 py-3 rounded-2xl border border-gray-800 focus:border-pink-400 focus:ring-1 focus:ring-pink-400/40 outline-none transition-all text-sm font-semibold"
                  autoFocus
                  maxLength={40}
                />
                <p className="text-[11px] text-gray-500 mt-2">
                  ✨ Will be instantly published to the global directory for all your friends to discover and join.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setMode('join')}
                  className="text-xs font-bold text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Looking to join an existing server?
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !serverName.trim()}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? <span>Creating...</span> : <span>Create Server</span>}
                </button>
              </div>
            </form>
          ) : (
            /* ──────── DISCOVER & SEARCH SERVERS ──────── */
            <div className="space-y-4">
              <div className="text-center pb-1">
                <h2 className="text-xl font-black text-white tracking-tight">Search & Join Servers</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Type any server name or invite code to find and join it in 1-click!
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Search / Invite Code Input with 1-Click Join */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (searchQuery.trim()) handleJoinServer(searchQuery.trim());
                      }
                    }}
                    placeholder="Enter invite code or server name (e.g. MAIH-3113)..."
                    className="w-full bg-[#07090E] text-white px-4 py-3 pl-10 rounded-2xl border border-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none text-xs font-semibold transition-all"
                    autoFocus
                  />
                  <Search size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
                </div>

                <button
                  type="button"
                  onClick={() => searchQuery.trim() && handleJoinServer(searchQuery.trim())}
                  disabled={!searchQuery.trim() || isLoading}
                  className={clsx(
                    "px-4 py-3 rounded-2xl font-black text-xs transition-all shadow-md flex items-center space-x-1.5 shrink-0 cursor-pointer",
                    searchQuery.trim()
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black active:scale-95 shadow-cyan-500/20"
                      : "bg-[#181D2A] text-gray-500 cursor-not-allowed opacity-60"
                  )}
                >
                  <span>{isLoading ? 'Joining...' : 'Join'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Server List Results */}
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                <div className="text-[10px] font-black uppercase text-gray-400 px-1">
                  Available Public Servers ({filteredDirectory.length})
                </div>

                {filteredDirectory.map((srv) => {
                  const isAlreadyJoined = servers.some(s => s.id === srv.id || s.name === srv.name);

                  return (
                    <div
                      key={srv.id}
                      className="p-3 bg-[#111522] hover:bg-[#161B28] rounded-2xl border border-white/5 hover:border-cyan-400/40 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <img
                          src={srv.iconUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(srv.name)}`}
                          alt={srv.name}
                          className="w-10 h-10 rounded-xl object-contain border border-white/10 shrink-0"
                        />
                        <div className="truncate">
                          <div className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors truncate">
                            {srv.name}
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                            {srv.inviteCode && (
                              <span className="font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                {srv.inviteCode}
                              </span>
                            )}
                            <span>• {srv.channels?.length || 2} Channels</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinServer(srv.inviteCode || srv.name)}
                        className={clsx(
                          "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center space-x-1 shadow-md",
                          isAlreadyJoined
                            ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:scale-105 active:scale-95"
                            : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black hover:scale-105 active:scale-95 shadow-cyan-500/20"
                        )}
                        title={isAlreadyJoined ? "Switch to this server" : "Join this server"}
                      >
                        {isAlreadyJoined ? (
                          <>
                            <Check size={13} className="stroke-[3]" />
                            <span>Switch Server</span>
                          </>
                        ) : (
                          <>
                            <span>Join Server</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateServerModal;
