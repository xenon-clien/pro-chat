import React, { useState, useRef } from 'react';
import { 
  X, LogOut, Database, User as UserIcon, Shield, CheckCircle2, 
  Upload, Sparkles, Image, Check, AlertCircle, Save, Camera, Zap, Rocket, Star, Palette
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { NitroModal } from './NitroModal';
import NitroBadge from '../ui/NitroBadge';
import clsx from 'clsx';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  { name: 'Cyber Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberBot' },
  { name: 'Neon Gamer', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonGamer' },
  { name: 'Ninja', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ninja' },
  { name: 'Pixel Hero', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelHero' },
  { name: 'Cyber Cat', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberCat' },
  { name: 'Hacker', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Hacker' },
  { name: 'Cosmic Wizard', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CosmicWizard' },
  { name: 'Gold Skull', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=GoldSkull' },
];

const PRESET_BANNER_COLORS = [
  '#FACC15', // Yellow
  '#A855F7', // Purple
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F97316', // Orange
  '#EF4444', // Red
  '#1E293B', // Slate
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, updateProfile } = useAuthStore();
  const { isNitro, nitroTier, nitroExpiresAt, boostCredits, bannerColor: nitroBannerColor, bannerUrl: nitroBannerUrl, updateBanner } = useNitroStore();
  
  const [activeTab, setActiveTab] = useState<'EDIT_PROFILE' | 'NITRO' | 'ACCOUNT' | 'DATABASE'>('EDIT_PROFILE');
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [bannerColor, setBannerColor] = useState(nitroBannerColor || '#FACC15');
  const [bannerUrl, setBannerUrl] = useState(nitroBannerUrl || '');
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
    window.location.reload();
  };

  // Handle local image file upload for avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle banner upload
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isNitro) {
      setIsNitroModalOpen(true);
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerUrl(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Display Name cannot be empty');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateProfile({
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || undefined
      });
      await updateBanner({
        bannerColor,
        bannerUrl: bannerUrl.trim() || undefined
      });
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div 
          className="relative w-full max-w-3xl bg-[#121418] text-[#dbdee1] rounded-2xl shadow-2xl overflow-hidden border border-yellow-400/30 flex flex-col md:flex-row min-h-[520px] max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Settings Navigation Sidebar */}
          <div className="w-full md:w-56 bg-[#090A0D] p-4 flex flex-col justify-between border-r border-[#1e222a] shrink-0">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-yellow-400/80 mb-3 px-2">
                User Settings
              </div>
              <div className="space-y-1">
                <button 
                  onClick={() => setActiveTab('EDIT_PROFILE')}
                  className={clsx(
                    "w-full flex items-center px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
                    activeTab === 'EDIT_PROFILE' ? "bg-yellow-400 text-black font-black shadow-sm" : "text-gray-400 hover:bg-[#161820] hover:text-yellow-400"
                  )}
                >
                  <Camera size={16} className="mr-2" />
                  Profiles & Banner
                </button>
                <button 
                  onClick={() => setActiveTab('NITRO')}
                  className={clsx(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
                    activeTab === 'NITRO' ? "bg-yellow-400 text-black font-black shadow-sm" : "text-gray-400 hover:bg-[#161820] hover:text-yellow-400"
                  )}
                >
                  <div className="flex items-center">
                    <Zap size={16} className="mr-2 fill-current" />
                    Nitro & Boosts
                  </div>
                  {isNitro ? (
                    <span className="text-[10px] bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded-full">ACTIVE</span>
                  ) : (
                    <span className="text-[10px] bg-yellow-400/20 text-yellow-400 font-black px-1.5 py-0.5 rounded-full">UPGRADE</span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('ACCOUNT')}
                  className={clsx(
                    "w-full flex items-center px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
                    activeTab === 'ACCOUNT' ? "bg-yellow-400 text-black font-black shadow-sm" : "text-gray-400 hover:bg-[#161820] hover:text-yellow-400"
                  )}
                >
                  <UserIcon size={16} className="mr-2" />
                  My Account
                </button>
                <button 
                  onClick={() => setActiveTab('DATABASE')}
                  className={clsx(
                    "w-full flex items-center px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
                    activeTab === 'DATABASE' ? "bg-yellow-400 text-black font-black shadow-sm" : "text-gray-400 hover:bg-[#161820] hover:text-yellow-400"
                  )}
                >
                  <Database size={16} className="mr-2" />
                  Database
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-sm font-bold transition-colors mt-6 cursor-pointer"
            >
              <LogOut size={16} className="mr-2" />
              Log Out
            </button>
          </div>

          {/* Right Settings Content */}
          <div className="flex-1 p-6 relative bg-[#121418] overflow-y-auto custom-scrollbar">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-yellow-400 transition-colors p-1.5 rounded-full hover:bg-[#1f222b] cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* TAB 1: EDIT PROFILE & BANNER */}
            {activeTab === 'EDIT_PROFILE' && (
              <div>
                <h2 className="text-xl font-black text-white mb-1 tracking-tight">Customize Profile</h2>
                <p className="text-xs text-gray-400 mb-4 font-medium">Personalize your avatar, banner image, and display name.</p>

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

                {/* Profile Card Preview with Banner & Avatar */}
                <div className="mb-6 rounded-2xl overflow-hidden border border-[#1e222a] bg-[#090A0D] shadow-xl">
                  {/* Banner */}
                  <div 
                    className="h-24 w-full relative group transition-all"
                    style={{ 
                      backgroundColor: bannerColor,
                      backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div 
                      onClick={() => {
                        if (!isNitro) {
                          setIsNitroModalOpen(true);
                        } else {
                          bannerFileInputRef.current?.click();
                        }
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-yellow-300 font-black text-xs cursor-pointer transition-opacity backdrop-blur-xs"
                    >
                      <Sparkles size={14} className="mr-1.5" />
                      {isNitro ? 'Change Banner' : 'Unlock Nitro Banner'}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 pt-0 relative flex items-end justify-between -mt-10">
                    <div className="flex items-end space-x-3">
                      <div className="relative group">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt="Avatar Preview" 
                            className="w-16 h-16 rounded-2xl object-cover border-4 border-[#090A0D] shadow-xl bg-black"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black text-2xl shadow-xl border-4 border-[#090A0D]">
                            {name ? name.substring(0, 2).toUpperCase() : 'GU'}
                          </div>
                        )}
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-yellow-400"
                        >
                          <Camera size={16} />
                        </div>
                      </div>
                      <div className="pb-1">
                        <div className="text-white font-extrabold text-base flex items-center gap-1.5">
                          {name || 'Guest User'}
                          {isNitro && <NitroBadge tier={nitroTier} size="sm" />}
                        </div>
                        <p className="text-[11px] text-gray-500">#{user?.id ? user.id.substring(0, 4) : '0001'}</p>
                      </div>
                    </div>

                    {!isNitro && (
                      <button
                        type="button"
                        onClick={() => setIsNitroModalOpen(true)}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs px-3 py-1.5 rounded-xl transition-transform hover:scale-105 shadow-md flex items-center gap-1 mb-1"
                      >
                        <Zap size={12} className="fill-black" />
                        Get Nitro
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Banner Controls */}
                  <div className="bg-[#090A0D] p-3.5 rounded-2xl border border-[#1e222a] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                        <Palette size={14} />
                        Profile Banner Theme
                      </label>
                      {!isNitro && (
                        <span className="text-[10px] text-yellow-400/80 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                          Nitro Perk
                        </span>
                      )}
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_BANNER_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBannerColor(c)}
                          className={clsx(
                            "w-7 h-7 rounded-lg transition-transform hover:scale-110 relative border-2",
                            bannerColor === c ? "border-white scale-110 shadow-md" : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                        >
                          {bannerColor === c && (
                            <Check size={12} className="text-white mx-auto stroke-[3]" />
                          )}
                        </button>
                      ))}
                      <input 
                        type="color" 
                        value={bannerColor} 
                        onChange={(e) => setBannerColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                        title="Custom Color"
                      />
                    </div>

                    {/* Banner Image URL */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        placeholder="Banner Image / GIF URL (e.g. https://...)"
                        className="flex-1 bg-[#121418] text-white px-3 py-2 rounded-xl border border-gray-800 focus:border-yellow-400 outline-none text-xs font-semibold"
                      />
                      <input 
                        type="file" 
                        ref={bannerFileInputRef} 
                        onChange={handleBannerFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!isNitro) setIsNitroModalOpen(true);
                          else bannerFileInputRef.current?.click();
                        }}
                        className="bg-[#171920] hover:bg-yellow-400 hover:text-black text-gray-300 px-3 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1 border border-gray-800"
                      >
                        <Upload size={13} />
                        Upload
                      </button>
                    </div>
                  </div>

                  {/* Preset Avatars Gallery */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-yellow-400 mb-2">
                      Choose Preset Avatar
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-[#090A0D] p-3 rounded-2xl border border-[#1e222a]">
                      {PRESET_AVATARS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          className={clsx(
                            "w-11 h-11 rounded-xl overflow-hidden border-2 transition-all p-1 bg-[#121418] hover:scale-105 cursor-pointer relative",
                            avatarUrl === preset.url ? "border-yellow-400 ring-2 ring-yellow-400/30 bg-yellow-400/10" : "border-gray-800 hover:border-gray-600"
                          )}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                          {avatarUrl === preset.url && (
                            <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-yellow-400 rounded-full flex items-center justify-center text-black">
                              <Check size={9} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direct Avatar inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-yellow-400 mb-1">
                        Avatar URL or GIF
                      </label>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.gif"
                        className="w-full bg-[#090A0D] text-white px-3 py-2 rounded-xl border border-gray-800 focus:border-yellow-400 outline-none text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-yellow-400 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={32}
                        className="w-full bg-[#090A0D] text-white px-3 py-2 rounded-xl border border-gray-800 focus:border-yellow-400 outline-none text-xs font-bold"
                      />
                    </div>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  {/* Save Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black text-sm font-black px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-yellow-400/20 flex items-center cursor-pointer disabled:opacity-50"
                    >
                      <Save size={16} className="mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: NITRO & BOOSTS */}
            {activeTab === 'NITRO' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Zap size={22} className="text-yellow-400 fill-yellow-400" />
                      ProChat Nitro
                    </h2>
                    <p className="text-xs text-gray-400 font-medium">Elevate your Discord-like experience with premium features.</p>
                  </div>
                  <button
                    onClick={() => setIsNitroModalOpen(true)}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-yellow-400/20 flex items-center gap-1.5"
                  >
                    <Star size={14} className="fill-black" />
                    {isNitro ? 'Manage Subscription' : 'Subscribe Now'}
                  </button>
                </div>

                {/* Current Status Box */}
                <div className="bg-[#090A0D] rounded-2xl p-4 border border-[#1e222a] mb-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e222a]">
                    <div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Subscription Status</div>
                      <div className="text-white font-black text-base mt-0.5 flex items-center gap-2">
                        {isNitro ? (
                          <>
                            <span className="text-yellow-400">ProChat {nitroTier === 'classic' ? 'Nitro Classic' : 'Nitro'}</span>
                            <NitroBadge tier={nitroTier} size="md" showLabel />
                          </>
                        ) : (
                          <span className="text-gray-400">Free Tier (No Active Nitro)</span>
                        )}
                      </div>
                    </div>
                    {isNitro && nitroExpiresAt && (
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 font-bold uppercase">Renews On</div>
                        <div className="text-xs text-gray-300 font-medium">{new Date(nitroExpiresAt).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>

                  {/* Boost inventory */}
                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Rocket size={18} className="text-yellow-400" />
                      <div>
                        <div className="text-white font-bold text-xs">Available Server Boosts</div>
                        <div className="text-[11px] text-gray-500">Boost your favorite servers to unlock higher quality perks</div>
                      </div>
                    </div>
                    <span className="text-yellow-400 font-black text-lg">{boostCredits}</span>
                  </div>
                </div>

                {/* Nitro Perks Grid */}
                <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400 mb-3">Your Nitro Privileges</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: 'Animated GIF Avatars', desc: 'Use dynamic avatars anywhere', unlocked: isNitro },
                    { title: 'Custom Profile Banners', desc: 'Custom header colors and images', unlocked: isNitro },
                    { title: 'HD 1080p 60FPS Streaming', desc: 'Ultra-crisp screen sharing & video', unlocked: isNitro && nitroTier === 'nitro' },
                    { title: '500MB File Uploads', desc: 'Send large high-res media', unlocked: isNitro },
                    { title: 'Global Custom Emojis', desc: 'Use emojis across all servers', unlocked: isNitro },
                    { title: 'Custom Soundboard Slots', desc: 'Unlimited custom sound uploads', unlocked: isNitro },
                  ].map((perk, i) => (
                    <div key={i} className={clsx(
                      "p-3 rounded-xl border text-xs",
                      perk.unlocked 
                        ? "bg-yellow-400/5 border-yellow-400/30 text-white" 
                        : "bg-[#090A0D] border-[#1e222a] text-gray-400"
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-white">{perk.title}</span>
                        {perk.unlocked ? (
                          <Check size={14} className="text-yellow-400" />
                        ) : (
                          <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-bold">LOCKED</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500">{perk.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: MY ACCOUNT */}
            {activeTab === 'ACCOUNT' && (
              <div>
                <h2 className="text-xl font-black text-white mb-6 tracking-tight">My Account</h2>

                <div className="bg-[#090A0D] rounded-2xl p-4 border border-[#1e222a] mb-6 shadow-inner">
                  <div className="flex items-center space-x-4 mb-4">
                    {user?.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt="User Avatar" 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-yellow-400 shadow-xl bg-black"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black text-2xl shadow-xl border-2 border-yellow-300">
                        {user?.name?.substring(0, 2).toUpperCase() || 'GU'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-white font-extrabold text-lg flex items-center gap-1.5">
                        {user?.name}
                        {isNitro && <NitroBadge tier={nitroTier} size="md" />}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">{user?.email || 'guest@prochat.io'}</p>
                      <div className="inline-flex items-center space-x-1 mt-1.5 px-2.5 py-0.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-[11px] font-bold rounded-full">
                        <CheckCircle2 size={12} />
                        <span>Online / Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#121418] rounded-xl p-3 space-y-2 text-xs border border-gray-800/80">
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">User ID</span>
                      <span className="text-gray-200 font-mono font-medium">{user?.id || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">Nitro Status</span>
                      <span className="text-yellow-400 font-bold flex items-center gap-1">
                        {isNitro ? `Active (${nitroTier?.toUpperCase()})` : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Authentication</span>
                      <span className="text-gray-200 font-medium">JWT Session</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  ProChat v2.5 • Nitro Engine • Supabase PostgreSQL • React + Vite
                </div>
              </div>
            )}

            {/* TAB 4: DATABASE */}
            {activeTab === 'DATABASE' && (
              <div>
                <h2 className="text-xl font-black text-white mb-4 tracking-tight">Database Architecture</h2>
                <div className="bg-[#090A0D] p-4 rounded-2xl border border-[#1e222a] space-y-3 text-xs">
                  <div className="flex items-center text-yellow-400 font-bold text-sm">
                    <Database size={16} className="mr-2" />
                    Supabase Cloud PostgreSQL
                  </div>
                  <p className="text-gray-400">Connected to remote managed Supabase database with Nitro & Server Boost tables.</p>
                  <div className="bg-[#121418] p-3 rounded-xl border border-gray-800 font-mono text-[11px] text-gray-300">
                    Status: 🟢 Connected & Synchronized (Prisma ORM)
                  </div>
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

