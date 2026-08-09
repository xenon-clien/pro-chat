import React, { useState } from 'react';
import {
  X, Zap, Star, Check, Crown, Rocket, Shield, Upload,
  Video, Smile, Volume2, Sparkles, Gift, ChevronRight,
  ArrowRight, Flame, Music, Monitor, Image
} from 'lucide-react';
import { useNitroStore, NITRO_PLANS } from '../../store/useNitroStore';
import type { NitroTier } from '../../store/useNitroStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useServerStore } from '../../store/useServerStore';
import clsx from 'clsx';

interface NitroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  'Animated': <Sparkles size={14} />,
  'Custom profile banner': <Image size={14} />,
  'badge': <Shield size={14} />,
  'message': <Zap size={14} />,
  'upload': <Upload size={14} />,
  'emoji': <Smile size={14} />,
  'Boost': <Rocket size={14} />,
  'screen': <Monitor size={14} />,
  'video': <Video size={14} />,
  'sound': <Music size={14} />,
  'Early': <Star size={14} />,
};

const getIcon = (feature: string) => {
  for (const [key, icon] of Object.entries(FEATURE_ICONS)) {
    if (feature.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return <Check size={14} />;
};

export const NitroModal: React.FC<NitroModalProps> = ({ isOpen, onClose }) => {
  const { isNitro, nitroTier, nitroExpiresAt, boostCredits, purchaseNitro, cancelNitro, isLoading } = useNitroStore();
  const { user } = useAuthStore();
  const { servers, activeServerId } = useServerStore();
  const [selectedPlan, setSelectedPlan] = useState<NitroTier>('nitro');
  const [view, setView] = useState<'plans' | 'confirm' | 'success' | 'manage'>('plans');
  const [purchasing, setPurchasing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setPurchasing(true);
    await purchaseNitro(selectedPlan);
    setPurchasing(false);
    setView('success');
  };

  const handleCancel = async () => {
    await cancelNitro();
    setView('plans');
  };

  const currentPlan = NITRO_PLANS.find(p => p.id === nitroTier);
  const expiryDate = nitroExpiresAt ? new Date(nitroExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl shadow-black/60 border border-[#1e222a]">
        {/* Animated gradient header */}
        <div className="relative overflow-hidden rounded-t-3xl">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background: isNitro
                ? 'linear-gradient(135deg, #7C3AED 0%, #FACC15 50%, #F97316 100%)'
                : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 40%, #FACC15 100%)',
            }}
          />
          {/* Floating orbs */}
          <div className="absolute top-4 right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 left-8 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl" />

          <div className="relative px-8 py-10 text-center">
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors">
              <X size={16} />
            </button>

            {isNitro ? (
              <>
                <div className="text-5xl mb-3">🌟</div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  You have <span className="text-yellow-300">{currentPlan?.name}</span>!
                </h2>
                <p className="text-white/70 mt-2 font-medium">Renews on {expiryDate} · {boostCredits} boost{boostCredits !== 1 ? 's' : ''} available</p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-white text-sm font-black mb-4 backdrop-blur-sm">
                  <Zap size={14} className="text-yellow-300" />
                  UPGRADE YOUR EXPERIENCE
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-2">
                  ProChat <span className="text-yellow-300">Nitro</span>
                </h2>
                <p className="text-white/70 font-medium max-w-md mx-auto">
                  Unlock animated avatars, HD streaming, server boosts, and more premium features
                </p>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="bg-[#0D0E12] rounded-b-3xl p-6">

          {/* ── ACTIVE SUBSCRIPTION VIEW ── */}
          {isNitro && (
            <div className="space-y-4">
              {/* Active perks grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: <Sparkles size={18} />, label: 'Animated Avatar', desc: 'Use GIF as profile pic' },
                  { icon: <Image size={18} />, label: 'Profile Banner', desc: nitroTier === 'nitro' ? 'Custom image banner' : 'Custom color banner' },
                  { icon: <Upload size={18} />, label: currentPlan?.uploadLimit + ' Uploads', desc: 'Increased file size limit' },
                  { icon: <Monitor size={18} />, label: currentPlan?.streamQuality, desc: 'Screen share quality' },
                  { icon: <Smile size={18} />, label: 'Global Emoji', desc: 'Use any server emoji' },
                  { icon: <Rocket size={18} />, label: `${boostCredits} Boosts`, desc: 'Boost any server' },
                ].map((perk, i) => (
                  <div key={i} className="bg-[#171920] border border-[#1e222a] rounded-2xl p-4 flex flex-col gap-2">
                    <div className="w-9 h-9 bg-yellow-400/10 border border-yellow-400/20 rounded-xl flex items-center justify-center text-yellow-400">
                      {perk.icon}
                    </div>
                    <div>
                      <div className="text-white font-black text-sm">{perk.label}</div>
                      <div className="text-gray-500 text-[11px]">{perk.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Manage buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setView('plans')}
                  className="flex-1 py-3 rounded-2xl bg-yellow-400 text-black font-black text-sm hover:bg-yellow-300 transition-colors"
                >
                  Upgrade Plan
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-2xl bg-[#171920] border border-red-500/30 text-red-400 font-black text-sm hover:bg-red-500/10 transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          )}

          {/* ── PLANS VIEW ── */}
          {(!isNitro || view === 'plans') && view !== 'success' && (
            <>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {NITRO_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={clsx(
                      'relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200',
                      selectedPlan === plan.id
                        ? plan.id === 'nitro'
                          ? 'border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10'
                          : 'border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                        : 'border-[#1e222a] bg-[#171920] hover:border-gray-600'
                    )}
                  >
                    {/* Best Value tag */}
                    {plan.id === 'nitro' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-400 text-black text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg">
                        ⭐ Best Value
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-2xl mb-1">{plan.badge}</div>
                        <h3 className="text-white font-black text-base leading-tight">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black" style={{ color: plan.color }}>${plan.price}</span>
                          <span className="text-gray-500 text-xs">/{plan.period}</span>
                        </div>
                      </div>
                      <div className={clsx(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0',
                        selectedPlan === plan.id ? 'border-yellow-400 bg-yellow-400' : 'border-gray-600'
                      )}>
                        {selectedPlan === plan.id && <Check size={11} className="text-black" strokeWidth={3} />}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-green-400 mt-0.5 shrink-0">{getIcon(feature)}</span>
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full py-4 rounded-2xl font-black text-black text-base transition-all shadow-xl shadow-yellow-400/20 hover:scale-[1.02] active:scale-100 relative overflow-hidden"
                style={{ background: 'linear-gradient(90deg, #FACC15, #F59E0B)' }}
              >
                {purchasing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Zap size={18} />
                    Subscribe to {NITRO_PLANS.find(p => p.id === selectedPlan)?.name} — ${NITRO_PLANS.find(p => p.id === selectedPlan)?.price}/mo
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>
              <p className="text-center text-gray-600 text-[11px] mt-3">
                Demo mode — no real payment required. Cancel anytime.
              </p>
            </>
          )}

          {/* ── SUCCESS VIEW ── */}
          {view === 'success' && (
            <div className="text-center py-8">
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-2xl font-black text-white mb-2">Welcome to Nitro!</h3>
              <p className="text-gray-400 mb-6">
                Your <strong className="text-yellow-400">{NITRO_PLANS.find(p => p.id === selectedPlan)?.name}</strong> subscription is now active.
                Enjoy all your new perks!
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6 max-w-sm mx-auto">
                {['Animated Avatar', 'Profile Banner', 'Nitro Badge', 'HD Streaming', 'Global Emoji', 'Server Boosts'].map((perk) => (
                  <div key={perk} className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 text-center">
                    <Check size={16} className="text-yellow-400 mx-auto mb-1" />
                    <div className="text-[10px] text-yellow-300 font-bold">{perk}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-yellow-400 text-black font-black hover:bg-yellow-300 transition-colors"
              >
                Start Exploring ✨
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
