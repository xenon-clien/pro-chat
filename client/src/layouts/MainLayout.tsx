import React, { useEffect, useState } from 'react';
import ServerSidebar from '../components/sidebar/ServerSidebar';
import ChannelSidebar from '../components/sidebar/ChannelSidebar';
import ChatArea from '../components/chat/ChatArea';
import { VoiceArea } from '../components/voice/VoiceArea';
import { MemberList } from '../components/chat/MemberList';
import { FriendsView } from '../components/home/FriendsView';
import DiscordTitleBar from '../components/ui/DiscordTitleBar';
import { useServerStore } from '../store/useServerStore';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { fetchServers, isLoading, servers, activeServerId, activeChannelId, joinServerByCode } = useServerStore();
  const [joinedToast, setJoinedToast] = useState<string | null>(null);

  useEffect(() => {
    fetchServers();

    // Auto-detect invite code from URL query params (e.g. ?join=GAME-7799 or ?invite=GAME-7799)
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
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#080A0F] select-none relative">
      {/* Discord Top Window Title Bar */}
      <DiscordTitleBar notificationCount="9+" />

      {/* Auto-Join Toast Notification */}
      {joinedToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-emerald-500 text-black font-black text-xs rounded-2xl shadow-2xl flex items-center space-x-2 animate-scale-up border-2 border-emerald-300">
          <CheckCircle2 size={18} className="stroke-[2.5]" />
          <span>{joinedToast}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex flex-1 w-full overflow-hidden bg-[#0B0E14]">
        <ServerSidebar />
        <ChannelSidebar />
        {isHome ? (
          <FriendsView />
        ) : activeChannel?.type === 'VOICE' ? (
          <div className="flex flex-1 h-full min-w-0 overflow-hidden">
            <VoiceArea />
            <MemberList serverId={activeServer?.id || 'pro-chat-hq'} />
          </div>
        ) : (
          <ChatArea />
        )}
      </div>
    </div>
  );
};

export default MainLayout;
