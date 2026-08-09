import { useEffect } from 'react';
import ServerSidebar from '../components/sidebar/ServerSidebar';
import ChannelSidebar from '../components/sidebar/ChannelSidebar';
import ChatArea from '../components/chat/ChatArea';
import { VoiceArea } from '../components/voice/VoiceArea';
import { FriendsView } from '../components/home/FriendsView';
import DiscordTitleBar from '../components/ui/DiscordTitleBar';
import { useServerStore } from '../store/useServerStore';

const MainLayout = () => {
  const { fetchServers, isLoading, servers, activeServerId, activeChannelId } = useServerStore();

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const isHome = activeServerId === 'home';
  const activeServer = isHome ? null : servers.find(s => s.id === activeServerId) || servers[0];
  const activeChannel = activeServer?.channels?.find(c => c.id === activeChannelId);

  if (isLoading && servers.length === 0) {
    return (
      <div className="flex h-screen w-full bg-[#08090B] items-center justify-center text-yellow-400 font-extrabold text-lg">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading ProChat...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#08090B] select-none">
      {/* Discord Top Window Title Bar */}
      <DiscordTitleBar notificationCount="9+" />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 w-full overflow-hidden bg-[#0D0E12]">
        <ServerSidebar />
        <ChannelSidebar />
        {isHome ? (
          <FriendsView />
        ) : activeChannel?.type === 'VOICE' ? (
          <VoiceArea />
        ) : (
          <ChatArea />
        )}
      </div>
    </div>
  );
};

export default MainLayout;

