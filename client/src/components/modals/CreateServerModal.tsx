import React, { useState } from 'react';
import { X, Upload, Sparkles } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { createServer } = useServerStore();
  const [serverName, setServerName] = useState(`${user?.name || 'My'}'s Server`);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#121418] text-[#dbdee1] rounded-2xl shadow-2xl overflow-hidden border border-yellow-400/30 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-yellow-400 transition-colors p-1.5 rounded-full hover:bg-gray-800"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="p-6 text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-yellow-400/5">
            <Sparkles size={24} className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Create Your Server</h2>
          <p className="text-sm text-gray-400 mt-1 px-4 leading-relaxed">
            Your server is where you and your friends hang out. Make yours and start talking.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-semibold">
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
              <p className="text-[11px] text-gray-500 mt-1.5 font-medium">
                Saved instantly to your Supabase PostgreSQL cloud database.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-[#090A0D] px-6 py-4 flex items-center justify-between border-t border-[#1e222a]">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-bold text-gray-400 hover:text-white hover:underline transition-colors px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !serverName.trim()}
              className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black text-sm font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Server</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
