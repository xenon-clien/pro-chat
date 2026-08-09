import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Shield, Users, Trash2, Upload, Check, AlertCircle, 
  Crown, Save, Camera, Image, Settings, Lock, CheckCircle2,
  Rocket, Zap, Star, Sparkles
} from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import type { Server } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { NitroModal } from './NitroModal';
import api from '../../lib/api';
import clsx from 'clsx';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: Server | undefined;
}

const PRESET_SERVER_ICONS = [
  { name: 'Cyber Hub', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=CyberHub' },
  { name: 'Gaming Zone', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=GamingZone' },
  { name: 'Neon Arcade', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=NeonArcade' },
  { name: 'Pro Chat', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=ProChat' },
  { name: 'Code Lab', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=CodeLab' },
  { name: 'VIP Lounge', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=VIPLounge' },
];

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({ isOpen, onClose, server }) => {
  const { user } = useAuthStore();
  const { updateServer, deleteServer } = useServerStore();
  const { isNitro, boostCredits, boostServer } = useNitroStore();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOOSTS' | 'ROLES'>('OVERVIEW');
  const [name, setName] = useState(server?.name || '');
  const [iconUrl, setIconUrl] = useState(server?.iconUrl || '');
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);
  const [serverBoosts, setServerBoosts] = useState<number>((server as any)?.boostCount || 2);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = server?.ownerId === user?.id;

  // Sync state when server changes
  useEffect(() => {
    if (server) {
      setName(server.name);
      setIconUrl(server.iconUrl || '');
      fetchMembers();
    }
  }, [server]);

  // Fetch server members
  const fetchMembers = async () => {
    if (!server) return;
    setIsLoadingMembers(true);
    try {
      const res = await api.get(`/servers/${server.id}/members`);
      setMembers(res.data);
    } catch (err: any) {
      console.error('Failed to fetch members', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  if (!isOpen || !server) return null;

  // Handle local file upload for server icon
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Icon size must be less than 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setIconUrl(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Save server overview changes
  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setErrorMessage('Only the server owner can change server settings and icon');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Server name cannot be empty');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateServer(server.id, {
        name: name.trim(),
        iconUrl: iconUrl.trim() || undefined
      });
      setSuccessMessage('Server settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update server');
    } finally {
      setIsSaving(false);
    }
  };

  // Change member role
  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!isOwner) {
      setErrorMessage('Only the server owner can change member roles');
      return;
    }

    try {
      await api.patch(`/servers/${server.id}/members/${memberId}/role`, { role: newRole });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      setSuccessMessage('Role updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update role');
    }
  };

  // Delete server
  const handleDeleteServer = async () => {
    if (!isOwner) return;
    if (confirm(`Are you sure you want to permanently delete "${server.name}"? This action cannot be undone.`)) {
      try {
        await deleteServer(server.id);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || 'Failed to delete server');
      }
    }
  };

  // Boost server handler
  const handleBoostServer = async () => {
    if (boostCredits <= 0) {
      setIsNitroModalOpen(true);
      return;
    }

    setIsBoosting(true);
    try {
      await boostServer(server.id);
      setServerBoosts(prev => prev + 1);
      setSuccessMessage('🚀 Server Boosted successfully! Thank you for supporting the community!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to boost server');
    } finally {
      setIsBoosting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div 
          className="relative w-full max-w-2xl bg-[#121418] text-[#dbdee1] rounded-2xl shadow-2xl overflow-hidden border border-yellow-400/30 flex flex-col md:flex-row min-h-[480px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Settings Navigation */}
          <div className="w-full md:w-52 bg-[#090A0D] p-4 flex flex-col justify-between border-r border-[#1e222a] shrink-0">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-yellow-400/80 mb-3 px-2 flex items-center">
                <Settings size={14} className="mr-1.5" />
                Server Settings
              </div>
              <div className="space-y-1">
                <button 
                  onClick={() => setActiveTab('OVERVIEW')}
                  className={clsx(
                    "w-full flex items-center px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
                    activeTab === 'OVERVIEW' ? "bg-yellow-400 text-black font-black shadow-sm" : "text-gray-400 hover:bg-[#161820] hover:text-yellow-400"
                  )}
                >
                  <Camera size={16} className="mr-2" />
                  Overview & Icon
                </button>
                <button 
                  onClick={() => setActiveTab('BOOSTS')}
                  className={clsx(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
                    activeTab === 'BOOSTS' ? "bg-yellow-400 text-black font-black shadow-sm" : "text-gray-400 hover:bg-[#161820] hover:text-yellow-400"
                  )}
                >
                  <div className="flex items-center">
                    <Rocket size={16} className="mr-2 text-yellow-400" />
                    Server Boosts
                  </div>
                  <span className="text-[10px] bg-yellow-400/20 text-yellow-400 font-black px-1.5 py-0.5 rounded-full">
                    {serverBoosts}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('ROLES')}
                  className={clsx(
                    "w-full flex items-center px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
                    activeTab === 'ROLES' ? "bg-yellow-400 text-black font-black shadow-sm" : "text-gray-400 hover:bg-[#161820] hover:text-yellow-400"
                  )}
                >
                  <Shield size={16} className="mr-2" />
                  Roles & Members
                </button>
              </div>
            </div>

            {/* Delete Server Option (Owner Only) */}
            {isOwner && (
              <button
                onClick={handleDeleteServer}
                className="flex items-center px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-sm font-bold transition-colors mt-6 cursor-pointer"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Server
              </button>
            )}
          </div>


        {/* Right Settings Content */}
        <div className="flex-1 p-6 relative bg-[#121418] overflow-y-auto custom-scrollbar">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-yellow-400 transition-colors p-1.5 rounded-full hover:bg-[#1f222b] cursor-pointer"
          >
            <X size={20} />
          </button>

          {/* Owner Notice Banner */}
          {!isOwner && (
            <div className="mb-4 p-3 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold rounded-xl flex items-center">
              <Lock size={15} className="mr-2 shrink-0 text-yellow-400" />
              <span>Read-Only: Only the Server Owner can edit server icon, name, and member roles.</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center">
              <CheckCircle2 size={16} className="mr-2 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl flex items-center">
              <AlertCircle size={16} className="mr-2 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & ICON */}
          {activeTab === 'OVERVIEW' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Server Overview</h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">Customize your server's icon (PFP) and display name.</p>
                </div>
                {isOwner && (
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-yellow-400/15 border border-yellow-400/40 rounded-full text-yellow-400 text-xs font-black">
                    <Crown size={13} />
                    <span>Owner</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveOverview} className="space-y-5">
                {/* Server Icon Preview & Upload */}
                <div className="bg-[#090A0D] p-4 rounded-2xl border border-[#1e222a] flex items-center space-x-5">
                  <div className="relative group shrink-0">
                    {iconUrl ? (
                      <img 
                        src={iconUrl} 
                        alt="Server Icon" 
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-yellow-400 shadow-xl bg-black"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black text-2xl shadow-xl border-2 border-yellow-300">
                        {name ? name.substring(0, 2).toUpperCase() : 'SV'}
                      </div>
                    )}

                    {isOwner && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-yellow-400"
                      >
                        <Camera size={20} />
                        <span className="text-[10px] font-black uppercase mt-1">Upload</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      disabled={!isOwner}
                      className="hidden" 
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!isOwner}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Upload size={14} className="mr-1.5" />
                        Upload Server Icon
                      </button>

                      {iconUrl && isOwner && (
                        <button
                          type="button"
                          onClick={() => setIconUrl('')}
                          className="bg-[#1e222a] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 font-bold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">Minimum 512x512 recommended (PNG, JPG, SVG).</p>
                  </div>
                </div>

                {/* Preset Server Icons */}
                {isOwner && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-yellow-400 mb-2">
                      Or Choose a Preset Server Icon
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-[#090A0D] p-3 rounded-2xl border border-[#1e222a]">
                      {PRESET_SERVER_ICONS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setIconUrl(preset.url)}
                          className={clsx(
                            "w-12 h-12 rounded-xl overflow-hidden border-2 transition-all p-1 bg-[#121418] hover:scale-105 cursor-pointer relative",
                            iconUrl === preset.url ? "border-yellow-400 ring-2 ring-yellow-400/30 bg-yellow-400/10" : "border-gray-800 hover:border-gray-600"
                          )}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                          {iconUrl === preset.url && (
                            <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-yellow-400 rounded-full flex items-center justify-center text-black">
                              <Check size={9} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Server Name Input */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-yellow-400 mb-1.5">
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isOwner}
                    maxLength={32}
                    className="w-full bg-[#090A0D] text-white px-3.5 py-2.5 rounded-xl border border-gray-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/40 outline-none text-sm font-bold disabled:opacity-50"
                  />
                </div>

                {/* Save Button */}
                {isOwner && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black text-sm font-black px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-yellow-400/20 flex items-center cursor-pointer disabled:opacity-50"
                    >
                      <Save size={16} className="mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: SERVER BOOSTS */}
          {activeTab === 'BOOSTS' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <Rocket size={22} className="text-yellow-400" />
                    Server Boost Status
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    Boost this server to unlock enhanced audio, more soundboard slots, and HD streaming!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBoostServer}
                  disabled={isBoosting}
                  className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-black text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-yellow-400/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Rocket size={14} className="fill-black" />
                  {isBoosting ? 'Boosting...' : 'Boost Server 🚀'}
                </button>
              </div>

              {/* Boost Progress Banner */}
              <div className="bg-[#090A0D] rounded-2xl p-4 border border-[#1e222a] mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-yellow-400">
                    Level {serverBoosts >= 14 ? 3 : serverBoosts >= 7 ? 2 : serverBoosts >= 2 ? 1 : 0} Unlocked
                  </span>
                  <span className="text-xs text-gray-400 font-bold">
                    {serverBoosts} / {serverBoosts >= 14 ? 14 : serverBoosts >= 7 ? 14 : serverBoosts >= 2 ? 7 : 2} Boosts
                  </span>
                </div>
                <div className="w-full h-3 bg-[#171920] rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (serverBoosts / 14) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-bold mt-2">
                  <span>Level 1 (2 Boosts)</span>
                  <span>Level 2 (7 Boosts)</span>
                  <span>Level 3 (14 Boosts)</span>
                </div>
              </div>

              {/* Levels Checklist */}
              <div className="space-y-3">
                {[
                  {
                    level: 1,
                    boosts: 2,
                    unlocked: serverBoosts >= 2,
                    perks: ['+50 Custom Soundboard Slots', '128 Kbps Audio Quality', 'Custom Server Invite Background']
                  },
                  {
                    level: 2,
                    boosts: 7,
                    unlocked: serverBoosts >= 7,
                    perks: ['1080p 60fps Stream Quality in Voice', '256 Kbps Audio Quality', '50MB Upload Limit for all members']
                  },
                  {
                    level: 3,
                    boosts: 14,
                    unlocked: serverBoosts >= 14,
                    perks: ['100MB Upload Limit for all members', '384 Kbps Studio Audio', 'Animated Server Icon & Banner']
                  }
                ].map((tier) => (
                  <div 
                    key={tier.level}
                    className={clsx(
                      "p-3.5 rounded-2xl border text-xs transition-all",
                      tier.unlocked 
                        ? "bg-yellow-400/5 border-yellow-400/40 shadow-sm" 
                        : "bg-[#090A0D] border-[#1e222a] opacity-70"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">Level {tier.level}</span>
                        <span className="text-[10px] text-gray-500 font-bold">({tier.boosts} Boosts)</span>
                      </div>
                      {tier.unlocked ? (
                        <span className="text-[10px] bg-yellow-400 text-black font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={10} strokeWidth={3} /> UNLOCKED
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-800 text-gray-400 font-bold px-2 py-0.5 rounded-full">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {tier.perks.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-gray-300">
                          <Sparkles size={11} className={tier.unlocked ? "text-yellow-400" : "text-gray-600"} />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ROLES & MEMBERS */}
          {activeTab === 'ROLES' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Roles & Permissions</h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    {isOwner ? 'Assign Admin, Moderator, or Guest roles to server members.' : 'View member roles in this server.'}
                  </p>
                </div>
              </div>

              {/* Members List with Role Dropdown */}
              <div className="space-y-2">
                {isLoadingMembers ? (
                  <div className="text-center text-yellow-400 py-6 text-sm font-bold">Loading members...</div>
                ) : members.length === 0 ? (
                  <div className="text-center text-gray-500 py-6 text-xs">No members found.</div>
                ) : (
                  members.map((member) => {
                    const isMemberOwner = member.userId === server.ownerId;
                    return (
                      <div 
                        key={member.id}
                        className="bg-[#090A0D] p-3 rounded-2xl border border-[#1e222a] flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          {member.user?.avatarUrl ? (
                            <img 
                              src={member.user.avatarUrl} 
                              alt="Avatar" 
                              className="w-10 h-10 rounded-full object-cover border border-yellow-400/60"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center font-extrabold text-xs">
                              {member.user?.name?.substring(0, 2).toUpperCase() || 'MB'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center">
                              <span className="text-sm font-bold text-white mr-1.5">{member.user?.name}</span>
                              {isMemberOwner && (
                                <Crown size={14} className="text-yellow-400 shrink-0" title="Server Owner" />
                              )}
                            </div>
                            <span className="text-[11px] text-gray-500">{member.user?.email}</span>
                          </div>
                        </div>

                        {/* Role Selector Dropdown */}
                        <div>
                          {isMemberOwner ? (
                            <span className="px-3 py-1 bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-extrabold rounded-lg">
                              Owner (Admin)
                            </span>
                          ) : isOwner ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value)}
                              className="bg-[#121418] text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-800 focus:border-yellow-400 outline-none cursor-pointer"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="MODERATOR">MODERATOR</option>
                              <option value="GUEST">GUEST</option>
                            </select>
                          ) : (
                            <span className="px-3 py-1 bg-[#121418] border border-gray-800 text-gray-300 text-xs font-bold rounded-lg">
                              {member.role}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    <NitroModal 
      isOpen={isNitroModalOpen}
      onClose={() => setIsNitroModalOpen(false)}
    />
  </>
);
};

export default ServerSettingsModal;


