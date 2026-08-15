import React, { useEffect, useState } from 'react';
import ServerSidebar from '../components/sidebar/ServerSidebar';
import ChannelSidebar from '../components/sidebar/ChannelSidebar';
import ChatArea from '../components/chat/ChatArea';
import { VoiceArea } from '../components/voice/VoiceArea';
import { MemberList } from '../components/chat/MemberList';
import { FriendsView } from '../components/home/FriendsView';
import DiscordTitleBar from '../components/ui/DiscordTitleBar';
import SplashScreen from '../components/ui/SplashScreen';
import MobileNavBar from '../components/mobile/MobileNavBar';
import { useServerStore } from '../store/useServerStore';
import { Sparkles, CheckCircle2, X } from 'lucide-react';
import clsx from 'clsx';

export const MainLayout: React.FC = () => {
  const { fetchServers, isLoading, servers, activeServerId, activeChannelId, joinServerByCode } = useServerStore();
  const [joinedToast, setJoinedToast] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileMemberListOpen, setIsMobileMemberListOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      await fetchServers();

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const inviteCode = params.get('join') || params.get('invite');
        const pathMatch = window.location.pathname.match(/\/invite\/([A-Za-z0-9_-]+)/);
        const targetCode = inviteCode || (pathMatch ? pathMatch[1] : null);

        if (targetCode) {
          try {
            const joined = await joinServerByCode(targetCode);
            setJoinedToast(`Joined "${joined.name || targetCode}" successfully! 🎉`);
            setTimeout(() => setJoinedToast(null), 4000);
            window.history.replaceState({}, '', window.location.pathname);
          } catch (err) {
            console.warn('Invite auto-join failed:', err);
          }
        }
      }
    };

    initApp();
  }, [fetchServers, joinServerByCode]);

  // Close mobile drawers when switching channels
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [activeChannelId, activeServerId]);

  const isHome = activeServerId === 'home';
  const activeServer = isHome ? null : servers.find(s => s.id === activeServerId) || servers[0];
  const activeChannel = activeServer?.channels?.find(c => c.id === activeChannelId);

  if (isLoading && servers.length === 0) {
    return (
      <div className="flex h-screen w-full bg-[#080A0F] items-center justify-center text-cyan-400 font-extrabold text-lg select-none">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading ProChat...</span>
      </div>
    );
  }

  return (
    <>
      {/* Native App Launch Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/*
        ╔═══════════════════════════════════════╗
        ║  DESKTOP LAYOUT (md and above)        ║
        ║  Top TitleBar → Main row → no bottom  ║
        ╠═══════════════════════════════════════╣
        ║  MOBILE LAYOUT (below md)             ║
        ║  No TitleBar → Content → Bottom Nav   ║
        ╚═══════════════════════════════════════╝
      */}
      <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[#080A0F] select-none">

        {/* ─── Desktop Only: TitleBar (hidden on mobile) ─── */}
        <div className="hidden md:block shrink-0">
          <DiscordTitleBar
            notificationCount="9+"
            onToggleMobileMenu={() => setIsMobileDrawerOpen(prev => !prev)}
            onToggleMemberList={() => setIsMobileMemberListOpen(prev => !prev)}
          />
        </div>

        {/* ─── Main Workspace (fills remaining space) ─── */}
        <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">

          {/* Backdrop: closes drawer when tapping outside */}
          {isMobileDrawerOpen && (
            <div
              className="md:hidden fixed inset-0 z-[55] bg-black/80 backdrop-blur-sm"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
          )}

          {/* ─── Left Sidebar Panel ─────────────────────────
              Desktop: always visible inline (static)
              Mobile:  fixed overlay, slides in from left
          ─────────────────────────────────────────────── */}
          <div className={clsx(
            // Shared
            'flex shrink-0 h-full z-[60] transition-transform duration-300 ease-in-out',
            // Desktop: part of the normal document flow
            'md:relative md:translate-x-0',
            // Mobile: fixed overlay
            'fixed inset-y-0 left-0',
            isMobileDrawerOpen ? 'translate-x-0 shadow-[6px_0_50px_rgba(0,0,0,0.9)]' : '-translate-x-full',
          )}>
            <ServerSidebar />
            <ChannelSidebar />
          </div>

          {/* ─── Center: Main Content fills full screen on mobile ─── */}
          <div className="flex-1 flex h-full min-w-0 overflow-hidden">
            {isHome ? (
              <FriendsView />
            ) : activeChannel?.type === 'VOICE' ? (
              <div className="flex flex-1 h-full min-w-0 overflow-hidden">
                <VoiceArea />
                {/* Desktop-only right member list */}
                <div className="hidden lg:block h-full shrink-0">
                  <MemberList serverId={activeServer?.id || 'pro-chat-hq'} />
                </div>
              </div>
            ) : (
              <ChatArea />
            )}
          </div>

          {/* ─── Mobile Right MemberList Drawer ─── */}
          {isMobileMemberListOpen && (
            <>
              <div
                className="md:hidden fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm"
                onClick={() => setIsMobileMemberListOpen(false)}
              />
              <div className="md:hidden fixed top-0 bottom-0 right-0 z-[60] w-72 bg-[#080A0F] shadow-2xl border-l border-white/10 flex flex-col">
                <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between text-xs font-bold text-gray-300 shrink-0">
                  <span>Server Members</span>
                  <button
                    onClick={() => setIsMobileMemberListOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <MemberList serverId={activeServer?.id || 'pro-chat-hq'} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Mobile Bottom Navigation Bar ─── */}
        <MobileNavBar
          onToggleDrawer={() => setIsMobileDrawerOpen(prev => !prev)}
          isDrawerOpen={isMobileDrawerOpen}
        />
      </div>

      {/* ─── Auto-Join Toast Notification ─── */}
      {joinedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-emerald-500 text-black font-black text-xs rounded-2xl shadow-2xl flex items-center space-x-2 animate-scale-up border-2 border-emerald-300">
          <CheckCircle2 size={18} className="stroke-[2.5]" />
          <span>{joinedToast}</span>
        </div>
      )}
    </>
  );
};

export default MainLayout;
