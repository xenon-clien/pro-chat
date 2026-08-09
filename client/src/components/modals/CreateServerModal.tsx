import React, { useState } from 'react';
import { X, Sparkles, UserPlus, ArrowRight, Shield } from 'lucide-react';
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
  const { createServer, joinServerByCode } = useServerStore();
  const [mode, setMode] = useState<'create' | 'join'>(initialMode);
  const [serverName, setServerName] = useState(`${user?.name || 'My'}'s Server`);
  const [inviteCode, setInviteCode] = useState('');
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

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code or link');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await joinServerByCode(inviteCode.trim());
      onClose();
    } catch (err: any) {
      setError('Invalid invite code or unable to join');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-md bg-[#121418] text-[#dbdee1] rounded-2xl shadow-2xl overflow-hidden border border-yellow-400/30 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-yellow-400 transition-colors p-1.5 rounded-full hover:bg-gray-800 cursor-pointer z-10"
        >
          <X size={20} />
        </button>

        {/* Tab Header: Create vs Join */}
        <div className="flex border-b border-[#1e222a] bg-[#090A0D]">
          <button
            onClick={() => { setMode('create'); setError(null); }}
            className={clsx(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              mode === 'create'
                ? "border-yellow-400 text-yellow-400 bg-[#121418]"
                : "border-transparent text-gray-400 hover:text-white"
            )}
          >
            Create a Server
          </button>
          <button
            onClick={() => { setMode('join'); setError(null); }}
            className={clsx(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5",
              mode === 'join'
                ? "border-yellow-400 text-yellow-400 bg-[#121418]"
                : "border-transparent text-gray-400 hover:text-white"
            )}
          >
            <UserPlus size={14} />
            <span>Join with Code</span>
          </button>
        </div>

        {mode === 'create' ? (
          /* Create Server View */
          <form onSubmit={handleCreateSubmit}>
            <div className="p-6 text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-yellow-400/5">
                <Sparkles size={24} className="text-yellow-400" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Create Your Server</h2>
              <p className="text-xs text-gray-400 mt-1 px-4 leading-relaxed">
                Your server is where you and your friends hang out. Make yours and start talking.
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-yellow-400 mb-2">
                  Server Name
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="e.g. Awesome Gaming Guild"
                  className="w-full bg-[#090A0D] text-white px-3.5 py-2.5 rounded-xl border border-gray-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/40 outline-none transition-all text-sm font-semibold"
                  autoFocus
                  maxLength={40}
                />
              </div>
            </div>

            <div className="bg-[#090A0D] px-6 py-4 flex items-center justify-between border-t border-[#1e222a]">
              <button
                type="button"
                onClick={() => setMode('join')}
                className="text-xs font-bold text-gray-400 hover:text-yellow-400 transition-colors"
              >
                Have an invite code?
              </button>
              <button
                type="submit"
                disabled={isLoading || !serverName.trim()}
                className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black text-xs font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
              >
                {isLoading ? <span>Creating...</span> : <span>Create Server</span>}
              </button>
            </div>
          </form>
        ) : (
          /* Join Server View */
          <form onSubmit={handleJoinSubmit}>
            <div className="p-6 text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-yellow-400/5">
                <UserPlus size={24} className="text-yellow-400" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Join a Server</h2>
              <p className="text-xs text-gray-400 mt-1 px-4 leading-relaxed">
                Enter an invite code below to join an existing server with your friends.
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-yellow-400 mb-2">
                  Server Invite Code or Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. PRO-HQ-8821 or GAME-7799"
                  className="w-full bg-[#090A0D] text-white px-3.5 py-2.5 rounded-xl border border-gray-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/40 outline-none transition-all text-sm font-mono uppercase"
                  autoFocus
                />
                
                <div className="mt-3 space-y-1.5 bg-[#090A0D] p-3 rounded-xl border border-white/5 text-[11px] text-gray-400">
                  <div className="font-bold text-gray-300 text-xs mb-1">Sample Available Invite Codes:</div>
                  <div 
                    onClick={() => setInviteCode('PRO-HQ-8821')}
                    className="flex items-center justify-between text-yellow-400 hover:underline cursor-pointer"
                  >
                    <span>• Pro Chat HQ Server</span>
                    <span className="font-mono bg-yellow-400/10 px-1.5 py-0.5 rounded">PRO-HQ-8821</span>
                  </div>
                  <div 
                    onClick={() => setInviteCode('GAME-7799')}
                    className="flex items-center justify-between text-yellow-400 hover:underline cursor-pointer"
                  >
                    <span>• Gaming Hub Guild</span>
                    <span className="font-mono bg-yellow-400/10 px-1.5 py-0.5 rounded">GAME-7799</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#090A0D] px-6 py-4 flex items-center justify-between border-t border-[#1e222a]">
              <button
                type="button"
                onClick={() => setMode('create')}
                className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !inviteCode.trim()}
                className="bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <span>Joining...</span>
                ) : (
                  <>
                    <span>Join Server</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateServerModal;
