import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Link, Shield, Sparkles, Clock, Search, Send, KeyRound } from 'lucide-react';
import { useNitroStore } from '../../store/useNitroStore';
import NitroBadge from '../ui/NitroBadge';
import clsx from 'clsx';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverName: string;
  inviteCode?: string;
}

const INVITE_FRIENDS = [
  {
    id: 'inv-1',
    name: 'CyberNinja',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja&backgroundColor=38bdf8',
    status: 'ONLINE',
    isNitro: true,
    nitroTier: 'nitro' as const,
  },
  {
    id: 'inv-2',
    name: 'NeonAura',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonAura&backgroundColor=f472b6',
    status: 'ONLINE',
    isNitro: true,
    nitroTier: 'nitro' as const,
  },
  {
    id: 'inv-3',
    name: 'GlitchMaster',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=GlitchMaster&backgroundColor=fbbf24',
    status: 'IDLE',
    isNitro: true,
    nitroTier: 'classic' as const,
  },
];

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  serverName,
  inviteCode = 'PRO-HQ',
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [search, setSearch] = useState('');
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});
  const { isNitro } = useNitroStore();

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://pro-chat-xenon-cliens-projects.vercel.app';
  const cleanCode = (inviteCode || 'PRO-HQ').trim().toUpperCase();
  const fullInviteUrl = `${currentHost}/?join=${encodeURIComponent(cleanCode)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullInviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendInvite = (friendId: string) => {
    setInvitedMap((prev) => ({ ...prev, [friendId]: true }));
  };

  const filteredFriends = INVITE_FRIENDS.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-md bg-[#0E121B] text-[#dbdee1] rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/40 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 text-left bg-[#0A0D14] border-b border-[#181D2A]">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-black uppercase tracking-wider mb-1">
            <UserPlus size={16} />
            <span>Invite Friends</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight truncate">
            Invite to <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">{serverName}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Share this short server code with your friend to join in 1 second!
          </p>
        </div>

        {/* PRIMARY: LARGE PROMINENT SERVER CODE BANNER */}
        <div className="p-6 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <KeyRound size={14} />
              <span>Server Invite Code</span>
            </label>
            <span className="text-[10px] text-gray-400 font-bold">Share with friend</span>
          </div>

          <div className="bg-[#07090E] p-3.5 rounded-2xl border-2 border-cyan-400/40 flex items-center justify-between shadow-lg shadow-cyan-500/10">
            <div className="flex flex-col pl-2">
              <div className="font-mono text-2xl font-black tracking-widest text-cyan-300">
                {cleanCode}
              </div>
              <span className="text-[10px] text-gray-500 font-bold">Also accepts PRO-HD / PRO-HQ</span>
            </div>

            <button
              onClick={handleCopyCode}
              className={clsx(
                "px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-md",
                copiedCode 
                  ? "bg-emerald-500 text-black scale-105" 
                  : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black active:scale-95"
              )}
            >
              {copiedCode ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* SECONDARY: FULL 1-CLICK WEB LINK */}
        <div className="px-6 pb-4">
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Link size={13} className="text-cyan-400" />
              <span>Or Direct 1-Click Link</span>
            </span>
          </label>

          <div className="flex items-center space-x-2 bg-[#0A0D14] p-1.5 pl-3 rounded-2xl border border-white/10 focus-within:border-cyan-400 transition-colors">
            <input
              type="text"
              readOnly
              value={fullInviteUrl}
              className="bg-transparent text-xs text-gray-300 flex-1 outline-none font-mono truncate"
            />
            <button
              onClick={handleCopyLink}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                copiedLink ? "bg-emerald-500 text-black font-bold" : "bg-[#182030] hover:bg-[#202B40] text-cyan-300 border border-cyan-500/30"
              )}
            >
              {copiedLink ? 'Copied Link!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0A0D14] border-t border-[#181D2A] flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center space-x-1.5 text-pink-400 font-bold">
            <Sparkles size={13} />
            <span>Instant Auto-Join Enabled</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
