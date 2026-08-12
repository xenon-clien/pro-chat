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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isMobileMemberListOpen, setIsMobileMemberListOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    fetchServers();

    // Auto-detect invite code from URL query params (e.g. ?join=PRO-HD or ?invite=PRO-HD)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('join') || params.get('invite');
      
      // Also check pathname /invite/<code>
      const pathMatch = window.location.pathname.match(/\/invite\/([A-Za-z0-9_-]+)/);
      const targetCode = inviteCode || (pathMatch ? pathMatch[1] : null);

      if (targetCode) {
        joinServerByCode(targetCode).then((joined) => {
          setJoinedToast(`Joined ${joined.name || targetCode} successfully! 🎉`);
          setTimeout(() => setJoinedToast(null), 4000);
          // Clean URL
          window.history.replaceState({}, '', '/');
        }).catch(err => {
          console.warn('Invite auto-join failed:', err);
        });
      }
    }
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

      <div className="flex flex-col h-screen w-full overflow-hidden bg-[#080A0F] select-none relative">
        {/* Discord Top Window Title Bar with Mobile Drawer Controls */}
        <DiscordTitleBar 
          notificationCount="9+" 
          onToggleMobileMenu={() => setIsMobileDrawerOpen(prev => !prev)}
          onToggleMemberList={() => setIsMobileMemberListOpen(prev => !prev)}
        />

        {/* Auto-Join Toast Notification */}
        {joinedToast && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-emerald-500 text-black font-black text-xs rounded-2xl shadow-2xl flex items-center space-x-2 animate-scale-up border-2 border-emerald-300">
            <CheckCircle2 size={18} className="stroke-[2.5]" />
            <span>{joinedToast}</span>
          </div>
        )}

        {/* Main Workspace Layout */}
        <div className="flex flex-1 w-full overflow-hidden bg-[#0B0E14] relative">
          
          {/* ─── Mobile Left Drawer Backdrop ─── */}
          {isMobileDrawerOpen && (
            <div 
              className="md:hidden fixed inset-0 z-[55] bg-black/75 backdrop-blur-sm"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
          )}

          {/* ─── Desktop & Mobile Left Sidebar Container ─── */}
          <div className={clsx(
            "flex h-full shrink-0 z-[60] transition-transform duration-300 ease-in-out",
            // Desktop: always visible inline
            "md:translate-x-0 md:static md:top-0 md:bottom-0",
            // Mobile: absolutely off-screen left, slides in as overlay
            "fixed top-9 bottom-14 left-0",
            isMobileDrawerOpen ? "translate-x-0 shadow-[4px_0_40px_rgba(0,0,0,0.8)]" : "-translate-x-full"
          )}>
            <ServerSidebar />
            <ChannelSidebar />
          </div>

          {/* ─── Center: Main Content (Friends / Voice / Chat) ─── */}
          <div className="flex-1 flex h-full min-w-0 overflow-hidden relative">
            {isHome ? (
              <FriendsView />
            ) : activeChannel?.type === 'VOICE' ? (
              <div className="flex flex-1 h-full min-w-0 overflow-hidden relative">
                <VoiceArea />
                {/* Desktop MemberList */}
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
              <div className="md:hidden fixed top-9 bottom-14 right-0 z-[60] w-72 bg-[#080A0F] shadow-2xl animate-scale-up border-l border-white/10 flex flex-col">
                <div className="h-10 px-4 border-b border-white/10 flex items-center justify-between text-xs font-bold text-gray-300">
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

        {/* ─── Mobile Bottom Navigation Bar (Discord Mobile App Style) ─── */}
        <MobileNavBar 
          onToggleDrawer={() => setIsMobileDrawerOpen(prev => !prev)}
          isDrawerOpen={isMobileDrawerOpen}
        />
      </div>
    </>
  );
};

export default MainLayout;
