import React, { useState, useRef, useEffect } from 'react';
import { 
  X, LogOut, Database, User as UserIcon, Shield, CheckCircle2, 
  Upload, Sparkles, Image, Check, AlertCircle, Save, Camera, Zap, 
  Rocket, Star, Palette, RefreshCw, Edit3
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
  { name: 'Pink Robot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=PinkRobot&backgroundColor=f472b6' },
  { name: 'Neon Cyber', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNeon&backgroundColor=38bdf8' },
  { name: 'Electric Fox', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ElectricFox&backgroundColor=818cf8' },
  { name: 'Sakura Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SakuraBot&backgroundColor=fb7185' },
  { name: 'Gold Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=shivam&backgroundColor=fbbf24' },
  { name: 'Pixel Hero', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelHero' },
  { name: 'Cosmic Wizard', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CosmicWizard' },
  { name: 'Cyber Cat', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberCat&backgroundColor=2dd4bf' },
];

const PRESET_BANNER_COLORS = [
  '#38BDF8', // Cyan
  '#F472B6', // Pink
  '#A855F7', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#0F172A', // Deep Slate
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, updateProfile } = useAuthStore();
  const { isNitro, nitroTier, nitroExpiresAt, boostCredits, bannerColor: nitroBannerColor, bannerUrl: nitroBannerUrl, updateBanner } = useNitroStore();
  
  const [activeTab, setActiveTab] = useState<'EDIT_PROFILE' | 'NITRO' | 'ACCOUNT' | 'DATABASE'>('EDIT_PROFILE');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerColor, setBannerColor] = useState('#38BDF8');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with active user whenever modal opens or user updates
  useEffect(() => {
    if (user) {
      setName(user.name || 'Pro Guest');
      setAvatarUrl(user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name || 'guest'}&backgroundColor=fbbf24`);
    }
    if (nitroBannerColor) setBannerColor(nitroBannerColor);
    if (nitroBannerUrl) setBannerUrl(nitroBannerUrl);
  }, [user, nitroBannerColor, nitroBannerUrl, isOpen]);

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
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerUrl(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 8);
    const colors = ['38bdf8', 'f472b6', 'fbbf24', '818cf8', '2dd4bf'];
    const randomBg = colors[Math.floor(Math.random() * colors.length)];
    const generated = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}&backgroundColor=${randomBg}`;
    setAvatarUrl(generated);
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
      setSuccessMessage('Profile and Avatar updated successfully! 🎉');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
        <div 
          className="relative w-full max-w-3xl bg-[#0E121B] text-[#dbdee1] rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/30 flex flex-col md:flex-row min-h-[540px] max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Settings Navigation Sidebar */}
          <div className="w-full md:w-60 bg-[#0A0D14] p-5 flex flex-col justify-between border-r border-[#181D2A] shrink-0">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-cyan-400 mb-4 px-2">
                User Settings
              </div>
              <div className="space-y-1.5">
                <button 
                  onClick={() => setActiveTab('EDIT_PROFILE')}
                  className={clsx(
                    "w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer",
                    activeTab === 'EDIT_PROFILE' ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/20" : "text-gray-400 hover:bg-[#111522] hover:text-white"
                  )}
                >
                  <Edit3 size={16} className="mr-2" />
                  Edit Profile & PFP
                </button>
                <button 
                  onClick={() => setActiveTab('NITRO')}
                  className={clsx(
                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer",
                    activeTab === 'NITRO' ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : "text-gray-400 hover:bg-[#111522] hover:text-white"
                  )}
                >
                  <div className="flex items-center">
                    <Zap size={16} className="mr-2 fill-current" />
                    Nitro & Boosts
                  </div>
                  {isNitro ? (
                    <span className="text-[10px] bg-white text-pink-600 font-black px-2 py-0.5 rounded-full">ACTIVE</span>
                  ) : (
                    <span className="text-[10px] bg-pink-500/20 text-pink-400 font-black px-2 py-0.5 rounded-full">UPGRADE</span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('ACCOUNT')}
                  className={clsx(
                    "w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer",
                    activeTab === 'ACCOUNT' ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/20" : "text-gray-400 hover:bg-[#111522] hover:text-white"
                  )}
                >
                  <UserIcon size={16} className="mr-2" />
                  My Account
                </button>
                <button 
                  onClick={() => setActiveTab('DATABASE')}
                  className={clsx(
                    "w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer",
                    activeTab === 'DATABASE' ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/20" : "text-gray-400 hover:bg-[#111522] hover:text-white"
                  )}
                >
                  <Database size={16} className="mr-2" />
                  Cloud Sync
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center px-3.5 py-2.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors mt-6 cursor-pointer"
            >
              <LogOut size={16} className="mr-2" />
              Log Out
            </button>
          </div>

          {/* Right Settings Content */}
          <div className="flex-1 p-6 relative bg-[#0E121B] overflow-y-auto custom-scrollbar">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-10"
            >
              <X size={20} />
            </button>

            {/* TAB 1: EDIT PROFILE & BANNER */}
            {activeTab === 'EDIT_PROFILE' && (
              <div>
                <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Edit Profile & Avatar</h2>
                <p className="text-xs text-gray-400 mb-4 font-medium">Update your username, profile picture, and custom banner theme.</p>

                {successMessage && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-2xl flex items-center">
                    <CheckCircle2 size={16} className="mr-2 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-2xl flex items-center">
                    <AlertCircle size={16} className="mr-2 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Profile Card Preview with Banner & Avatar */}
                <div className="mb-5 rounded-3xl overflow-hidden border border-[#181D2A] bg-[#0A0D14] shadow-xl">
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
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-cyan-300 font-black text-xs cursor-pointer transition-opacity backdrop-blur-xs"
                    >
                      <Sparkles size={14} className="mr-1.5" />
                      Change Banner
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 pt-0 relative flex items-end justify-between -mt-10">
                    <div className="flex items-end space-x-3">
                      <div className="relative group">
                        <img 
                          src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${name || 'guest'}&backgroundColor=fbbf24`} 
                          alt="Avatar Preview" 
                          className="w-18 h-18 rounded-3xl object-contain border-4 border-[#0A0D14] shadow-2xl bg-[#0E121B]"
                        />
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-cyan-400"
                          title="Upload Custom PFP"
                        >
                          <Camera size={18} />
                        </div>
                      </div>
                      <div className="pb-1">
                        <div className="text-white font-black text-base flex items-center gap-1.5">
                          {name || 'Pro Guest'}
                          {isNitro && <NitroBadge tier={nitroTier} size="sm" />}
                        </div>
                        <p className="text-[11px] text-cyan-400 font-mono font-bold">@{name.toLowerCase().replace(/\s+/g, '_') || 'guest'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateRandomAvatar}
                      className="bg-[#111522] hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      Randomize PFP
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-cyan-400 mb-1.5">
                      Display Name / Username
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={32}
                      placeholder="Enter your name (e.g. shivam, Alex)..."
                      className="w-full bg-[#07090E] text-white px-4 py-3 rounded-2xl border border-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none text-sm font-bold transition-all"
                    />
                  </div>

                  {/* Preset Avatars Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black uppercase tracking-wider text-pink-400">
                        Choose Character Avatar
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={12} />
                        Upload Custom Photo
                      </button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-[#07090E] p-3 rounded-2xl border border-gray-800">
                      {PRESET_AVATARS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          className={clsx(
                            "w-11 h-11 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-[#0E121B] hover:scale-105 cursor-pointer relative",
                            avatarUrl === preset.url ? "border-cyan-400 ring-2 ring-cyan-400/30 bg-cyan-400/10" : "border-gray-800 hover:border-gray-600"
                          )}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                          {avatarUrl === preset.url && (
                            <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-cyan-400 rounded-full flex items-center justify-center text-black">
                              <Check size={9} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Banner Theme Color */}
                  <div className="bg-[#07090E] p-3.5 rounded-2xl border border-gray-800 space-y-2.5">
                    <label className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Palette size={14} />
                      Profile Banner Color Theme
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_BANNER_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBannerColor(c)}
                          className={clsx(
                            "w-7 h-7 rounded-xl transition-transform hover:scale-110 relative border-2",
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
                        className="w-7 h-7 rounded-xl cursor-pointer bg-transparent border-0"
                        title="Custom Color"
                      />
                    </div>
                  </div>

                  {/* Hidden File Inputs */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <input 
                    type="file" 
                    ref={bannerFileInputRef} 
                    onChange={handleBannerFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  {/* Save Changes Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 hover:from-cyan-300 hover:via-blue-400 hover:to-pink-400 text-black text-xs font-black px-8 py-3 rounded-2xl transition-all shadow-xl shadow-cyan-500/20 flex items-center cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
                    >
                      <Save size={15} className="mr-2" />
                      {isLoading ? 'Saving...' : 'Save Profile Changes 🚀'}
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
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      <Zap size={24} className="text-pink-400 fill-pink-400" />
                      ProChat Nitro
                    </h2>
                    <p className="text-xs text-gray-400 font-medium">Elevate your Discord-like experience with premium features.</p>
                  </div>
                  <button
                    onClick={() => setIsNitroModalOpen(true)}
                    className="bg-pink-500 hover:bg-pink-400 text-white font-black text-xs px-4 py-2 rounded-2xl transition-all shadow-lg shadow-pink-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Star size={14} className="fill-white" />
                    {isNitro ? 'Manage Subscription' : 'Subscribe Now'}
                  </button>
                </div>

                <div className="bg-[#0A0D14] rounded-3xl p-4 border border-[#181D2A] mb-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#181D2A]">
                    <div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Subscription Status</div>
                      <div className="text-white font-black text-base mt-0.5 flex items-center gap-2">
                        {isNitro ? (
                          <>
                            <span className="text-pink-400">ProChat {nitroTier === 'classic' ? 'Nitro Classic' : 'Nitro'}</span>
                            <NitroBadge tier={nitroTier} size="md" showLabel />
                          </>
                        ) : (
                          <span className="text-gray-400">Free Tier (No Active Nitro)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Rocket size={18} className="text-pink-400" />
                      <div>
                        <div className="text-white font-bold text-xs">Available Server Boosts</div>
                        <div className="text-[11px] text-gray-500">Boost your favorite servers to unlock HD streaming</div>
                      </div>
                    </div>
                    <span className="text-pink-400 font-black text-lg">{boostCredits}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MY ACCOUNT */}
            {activeTab === 'ACCOUNT' && (
              <div>
                <h2 className="text-2xl font-black text-white mb-4 tracking-tight">My Account</h2>
                <div className="bg-[#0A0D14] rounded-3xl p-4 border border-[#181D2A] mb-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <img 
                      src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=shivam&backgroundColor=fbbf24'} 
                      alt="User Avatar" 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-xl bg-black"
                    />
                    <div>
                      <h3 className="text-white font-extrabold text-lg flex items-center gap-1.5">
                        {user?.name}
                        {isNitro && <NitroBadge tier={nitroTier} size="md" />}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">{user?.email || 'user@prochat.io'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CLOUD SYNC */}
            {activeTab === 'DATABASE' && (
              <div>
                <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Real-Time Cloud Sync</h2>
                <div className="bg-[#0A0D14] p-4 rounded-3xl border border-[#181D2A] space-y-3 text-xs">
                  <p className="text-gray-400">Global MQTT WebSockets & Supabase Cloud Storage are connected and active.</p>
                  <div className="bg-[#07090E] p-3 rounded-2xl border border-gray-800 font-mono text-[11px] text-emerald-400">
                    Status: 🟢 Connected (Cross-Device Internet Relay Active)
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

export default UserSettingsModal;
