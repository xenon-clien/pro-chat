import React, { useState } from 'react';
import { X, Hash, Volume2 } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose, serverId }) => {
  const { createChannel } = useServerStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a channel name');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await createChannel(serverId, name.trim(), type);
      setName('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#121418] text-[#dbdee1] rounded-2xl shadow-2xl overflow-hidden border border-yellow-400/30"
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
        <div className="p-6 pb-2">
          <h2 className="text-xl font-black text-white tracking-tight">Create Channel</h2>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            in Text & Voice Channels
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-3 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Channel Type */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-yellow-400 mb-2">
                Channel Type
              </label>
              <div className="space-y-2">
                <div 
                  onClick={() => setType('TEXT')}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border ${type === 'TEXT' ? 'bg-yellow-400/10 border-yellow-400 text-yellow-300' : 'bg-[#090A0D] border-gray-800 hover:bg-[#181a20]'}`}
                >
                  <Hash size={22} className={type === 'TEXT' ? 'text-yellow-400 mr-3' : 'text-gray-400 mr-3'} />
                  <div>
                    <div className="text-sm font-bold text-white">Text Channel</div>
                    <div className="text-xs text-gray-400">Post messages, images, emojis, and code</div>
                  </div>
                </div>

                <div 
                  onClick={() => setType('VOICE')}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border ${type === 'VOICE' ? 'bg-yellow-400/10 border-yellow-400 text-yellow-300' : 'bg-[#090A0D] border-gray-800 hover:bg-[#181a20]'}`}
                >
                  <Volume2 size={22} className={type === 'VOICE' ? 'text-yellow-400 mr-3' : 'text-gray-400 mr-3'} />
                  <div>
                    <div className="text-sm font-bold text-white">Voice Channel</div>
                    <div className="text-xs text-gray-400">Hang out together with voice and audio</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Channel Name */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-yellow-400 mb-2">
                Channel Name
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-yellow-400 font-bold">#</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="new-channel"
                  className="w-full bg-[#090A0D] text-white pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/40 outline-none transition-all text-sm font-semibold"
                  autoFocus
                  maxLength={30}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-[#090A0D] px-6 py-4 flex items-center justify-between border-t border-[#1e222a]">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-bold text-gray-400 hover:text-white hover:underline transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black text-sm font-black px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
