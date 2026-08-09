import { useEffect } from 'react';
import ServerSidebar from '../components/sidebar/ServerSidebar';
import ChannelSidebar from '../components/sidebar/ChannelSidebar';
import ChatArea from '../components/chat/ChatArea';
import { VoiceArea } from '../components/voice/VoiceArea';
import { useServerStore } from '../store/useServerStore';

const MainLayout = () => {
  const { fetchServers, isLoading, servers, activeServerId, activeChannelId } = useServerStore();

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const activeServer = servers.find(s => s.id === activeServerId);
  const activeChannel = activeServer?.channels.find(c => c.id === activeChannelId);

  if (isLoading && servers.length === 0) {
    return (
      <div className="flex h-screen w-full bg-[#08090B] items-center justify-center text-yellow-400 font-extrabold text-lg">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading ProChat...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0D0E12]">
      <ServerSidebar />
      <ChannelSidebar />
      {activeChannel?.type === 'VOICE' ? (
        <VoiceArea />
      ) : (
        <ChatArea />
      )}
    </div>
  );
};

export default MainLayout;
