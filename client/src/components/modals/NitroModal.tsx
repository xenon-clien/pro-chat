import React, { useState } from 'react';
import {
  X, Zap, Star, Check, Crown, Rocket, Shield, Upload,
  Video, Smile, Volume2, Sparkles, Gift, ChevronRight,
  ArrowRight, Flame, Music, Monitor, Image, Copy, Heart, Send
} from 'lucide-react';
import { useNitroStore, NITRO_PLANS } from '../../store/useNitroStore';
import type { NitroTier } from '../../store/useNitroStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useServerStore } from '../../store/useServerStore';
import clsx from 'clsx';

interface NitroModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'plans' | 'gift';
}

const GIFT_THEMES = [
  { id: 'neon', name: 'Cyber Neon', gradient: 'from-cyan-500 via-blue-600 to-pink-500', emoji: '🎮' },
  { id: 'pink', name: 'Sakura Blush', gradient: 'from-pink-400 via-rose-500 to-purple-600', emoji: '🌸' },
  { id: 'gold', name: 'Royal Gold', gradient: 'from-yellow-400 via-amber-500 to-orange-600', emoji: '👑' },
  { id: 'galaxy', name: 'Deep Galaxy', gradient: 'from-purple-600 via-indigo-700 to-blue-900', emoji: '🌌' },
];

export const NitroModal: React.FC<NitroModalProps> = ({ isOpen, onClose, defaultTab = 'plans' }) => {
  const { 
    isNitro, nitroTier, nitroExpiresAt, boostCredits, 
    purchaseNitro, cancelNitro, boostServer, createNitroGift, 
    updateBanner, isLoading 
  } = useNitroStore();
  const { user } = useAuthStore();
  const { servers, activeServerId } = useServerStore();
  
  const [activeTab, setActiveTab] = useState<'plans' | 'gift' | 'customize'>(defaultTab);
  const [selectedPlan, setSelectedPlan] = useState<NitroTier>('nitro');
  const [purchasing, setPurchasing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Gift State
  const [giftTier, setGiftTier] = useState<NitroTier>('nitro');
  const [selectedTheme, setSelectedTheme] = useState(GIFT_THEMES[0]);
  const [generatedGiftCode, setGeneratedGiftCode] = useState<string | null>(null);
  const [copiedGift, setCopiedGift] = useState(false);

  // Customization State
  const [selectedBanner, setSelectedBanner] = useState('#F472B6');

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setPurchasing(true);
    await purchaseNitro(selectedPlan);
    setPurchasing(false);
    setSuccessMsg(`🎉 Welcome to ${NITRO_PLANS.find(p => p.id === selectedPlan)?.name}! All perks are now active.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleCreateGift = () => {
    const gift = createNitroGift(giftTier);
    setGeneratedGiftCode(gift.code);
  };

  const handleCopyGiftLink = () => {
    if (!generatedGiftCode) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pro-chat.vercel.app';
    const link = `${origin}/gift/${generatedGiftCode}`;
    navigator.clipboard.writeText(link);
    setCopiedGift(true);
    setTimeout(() => setCopiedGift(false), 2500);
  };

  const handleApplyBanner = (color: string) => {
    setSelectedBanner(color);
    updateBanner({ bannerColor: color });
  };

  const handleBoostActiveServer = async () => {
    if (!activeServerId) return;
    try {
      await boostServer(activeServerId);
      setSuccessMsg('🚀 Server successfully boosted to Level 1 with HD audio and custom banner!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      alert('No boost credits remaining.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0D1017] rounded-3xl shadow-2xl border border-pink-500/30 overflow-hidden z-10 animate-scale-up max-h-[92vh] flex flex-col">
        {/* Header with Gradient and Tabs */}
        <div className="relative bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 p-6 text-white shrink-0 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="flex items-center space-x-2 text-yellow-300 text-xs font-black uppercase tracking-wider mb-1">
            <Sparkles size={16} />
            <span>ProChat Premium Experience</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            ProChat <span className="text-yellow-300">Nitro & Gifts</span>
          </h2>
          <p className="text-white/80 text-xs mt-1 max-w-md">
            Unlock 1080p 60fps HD streaming, animated avatars, server boosts, and gift Nitro to your best friends!
          </p>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setActiveTab('plans')}
              className={clsx(
                "px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5",
                activeTab === 'plans'
                  ? "bg-white text-black shadow-lg"
                  : "bg-black/30 hover:bg-black/40 text-white"
              )}
            >
              <Zap size={14} />
              <span>Nitro Plans</span>
            </button>

            <button
              onClick={() => setActiveTab('gift')}
              className={clsx(
                "px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5",
                activeTab === 'gift'
                  ? "bg-white text-black shadow-lg"
                  : "bg-black/30 hover:bg-black/40 text-white"
              )}
            >
              <Gift size={14} className="text-pink-400" />
              <span>Gift a Friend 🎁</span>
            </button>

            {isNitro && (
              <button
                onClick={() => setActiveTab('customize')}
                className={clsx(
                  "px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5",
                  activeTab === 'customize'
                    ? "bg-white text-black shadow-lg"
                    : "bg-black/30 hover:bg-black/40 text-white"
                )}
              >
                <Crown size={14} className="text-amber-400" />
                <span>My Perks & Banner</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold px-6 py-2.5 flex items-center space-x-2 animate-fade-in">
            <Check size={16} className="text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {/* ──────── TAB 1: NITRO PLANS ──────── */}
          {activeTab === 'plans' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {NITRO_PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  const isCurrent = isNitro && nitroTier === plan.id;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={clsx(
                        "rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 relative bg-[#111522]",
                        isSelected
                          ? "border-pink-400 shadow-xl shadow-pink-500/15 ring-1 ring-pink-400/40"
                          : "border-[#1D2436] hover:border-cyan-400/40"
                      )}
                    >
                      {plan.id === 'nitro' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-pink-500 to-cyan-400 text-black text-[10px] font-black rounded-full uppercase tracking-wider shadow-md">
                          ⭐ Most Popular
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl">{plan.badge}</div>
                        {isCurrent && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            Active Plan
                          </span>
                        )}
                      </div>

                      <h3 className="text-white font-black text-lg">{plan.name}</h3>
                      <div className="text-2xl font-black text-pink-400 my-1">
                        ${plan.price} <span className="text-xs text-gray-400 font-medium">/{plan.period}</span>
                      </div>

                      <div className="space-y-1.5 mt-3 pt-3 border-t border-white/5">
                        {plan.features.slice(0, 5).map((f, i) => (
                          <div key={i} className="flex items-center space-x-2 text-xs text-gray-300">
                            <Check size={13} className="text-cyan-400 shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-400 hover:from-pink-400 hover:via-purple-500 hover:to-cyan-300 text-black font-black text-sm transition-all shadow-xl shadow-pink-500/25 flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.01] active:scale-98"
                >
                  {purchasing ? (
                    <span>Activating Nitro...</span>
                  ) : (
                    <>
                      <Zap size={18} className="fill-black text-black" />
                      <span>
                        {isNitro ? 'Switch to ' : 'Unlock '} 
                        {NITRO_PLANS.find(p => p.id === selectedPlan)?.name} (Instant Free Demo)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ──────── TAB 2: GIFT A FRIEND ──────── */}
          {activeTab === 'gift' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="text-4xl mb-1">🎁</div>
                <h3 className="text-xl font-black text-white">Gift Nitro to a Friend</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Select a card style, generate an instant gift link, and share it with your friend in chat!
                </p>
              </div>

              {/* Select Gift Tier */}
              <div>
                <label className="block text-xs font-black uppercase text-pink-400 mb-2">1. Choose Gift Tier</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setGiftTier('nitro')}
                    className={clsx(
                      "p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between",
                      giftTier === 'nitro'
                        ? "bg-pink-500/10 border-pink-400 text-white"
                        : "bg-[#111522] border-[#1D2436] text-gray-400"
                    )}
                  >
                    <div>
                      <div className="font-black text-xs text-white">Nitro Boost Gift 🌟</div>
                      <div className="text-[11px] text-pink-400 font-bold">$9.99 (Free in Demo)</div>
                    </div>
                    {giftTier === 'nitro' && <Check size={16} className="text-pink-400" />}
                  </div>

                  <div
                    onClick={() => setGiftTier('classic')}
                    className={clsx(
                      "p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between",
                      giftTier === 'classic'
                        ? "bg-cyan-500/10 border-cyan-400 text-white"
                        : "bg-[#111522] border-[#1D2436] text-gray-400"
                    )}
                  >
                    <div>
                      <div className="font-black text-xs text-white">Nitro Classic Gift ⚡</div>
                      <div className="text-[11px] text-cyan-400 font-bold">$4.99 (Free in Demo)</div>
                    </div>
                    {giftTier === 'classic' && <Check size={16} className="text-cyan-400" />}
                  </div>
                </div>
              </div>

              {/* Select Card Theme */}
              <div>
                <label className="block text-xs font-black uppercase text-cyan-400 mb-2">2. Gift Card Style</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {GIFT_THEMES.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme)}
                      className={clsx(
                        "p-2.5 rounded-xl border cursor-pointer text-center transition-all bg-[#111522]",
                        selectedTheme.id === theme.id
                          ? "border-pink-400 ring-2 ring-pink-400/30"
                          : "border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className={clsx("w-full h-8 rounded-lg bg-gradient-to-r mb-1 flex items-center justify-center text-sm shadow-md", theme.gradient)}>
                        {theme.emoji}
                      </div>
                      <span className="text-[11px] font-bold text-gray-300">{theme.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Gift Link Button or Display */}
              {!generatedGiftCode ? (
                <button
                  onClick={handleCreateGift}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-pink-500/20 cursor-pointer hover:scale-[1.01]"
                >
                  Generate Shareable Gift Link 🎁
                </button>
              ) : (
                <div className="p-4 bg-[#090C12] border border-pink-500/40 rounded-2xl space-y-3 animate-scale-up">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-pink-400 uppercase">Your Gift Link is Ready!</span>
                    <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-bold">1-Click Redeem</span>
                  </div>

                  <div className="flex items-center space-x-2 bg-[#111522] p-2 rounded-xl border border-white/10">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${typeof window !== 'undefined' ? window.location.origin : 'https://pro-chat.vercel.app'}/gift/${generatedGiftCode}`}
                      className="bg-transparent text-white text-xs w-full outline-none font-mono"
                    />
                    <button
                      onClick={handleCopyGiftLink}
                      className={clsx(
                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer flex items-center space-x-1",
                        copiedGift ? "bg-emerald-500 text-white" : "bg-pink-400 hover:bg-pink-300 text-black"
                      )}
                    >
                      {copiedGift ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedGift ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Send this link in `#general` or direct message — your friend clicks it and gets Nitro instantly!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ──────── TAB 3: CUSTOMIZE & PERKS ──────── */}
          {activeTab === 'customize' && (
            <div className="space-y-5">
              {/* Server Boost Action */}
              <div className="p-4 bg-[#111522] border border-yellow-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-yellow-400 text-xs font-black uppercase">
                    <Rocket size={14} />
                    <span>Server Boost Credits</span>
                  </div>
                  <div className="text-lg font-black text-white mt-0.5">
                    {boostCredits} Boosts Available
                  </div>
                  <div className="text-xs text-gray-400">Boost your server for Level 1 perks & HD voice.</div>
                </div>
                <button
                  onClick={handleBoostActiveServer}
                  disabled={boostCredits <= 0}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 text-black font-black text-xs shadow-md disabled:opacity-40 cursor-pointer"
                >
                  Boost This Server 🚀
                </button>
              </div>

              {/* Profile Banner Color Picker */}
              <div>
                <label className="block text-xs font-black uppercase text-pink-400 mb-2">Profile Banner Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {['#F472B6', '#38BDF8', '#A855F7', '#10B981'].map((color) => (
                    <div
                      key={color}
                      onClick={() => handleApplyBanner(color)}
                      style={{ backgroundColor: color }}
                      className={clsx(
                        "h-12 rounded-xl cursor-pointer transition-all flex items-center justify-center shadow-md",
                        selectedBanner === color ? "ring-4 ring-white" : "opacity-80 hover:opacity-100"
                      )}
                    >
                      {selectedBanner === color && <Check size={18} className="text-black stroke-[3]" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NitroModal;
