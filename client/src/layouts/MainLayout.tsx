import { useEffect } from 'react';
import ServerSidebar from '../components/sidebar/ServerSidebar';
import ChannelSidebar from '../components/sidebar/ChannelSidebar';
import ChatArea from '../components/chat/ChatArea';
import { useServerStore } from '../store/useServerStore';

const MainLayout = () => {
  const { fetchServers, isLoading } = useServerStore();

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  if (isLoading) {
    return <div className="flex h-screen w-full bg-gray-900 items-center justify-center text-white">Loading ProChat...</div>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-800">
      <ServerSidebar />
      <ChannelSidebar />
      <ChatArea />
    </div>
  );
};

export default MainLayout;
