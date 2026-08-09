import { Hash, Volume2, ChevronDown, Settings, Mic, Headphones } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import clsx from 'clsx';

const ChannelSidebar = () => {
  const { servers, activeServerId, activeChannelId, setActiveChannel } = useServerStore();
  const { user } = useAuthStore();
  
  const activeServer = servers.find(s => s.id === activeServerId);
  
  if (!activeServer) return <div className="w-60 bg-gray-800 flex flex-col h-full shrink-0"></div>;

  const textChannels = activeServer.channels.filter(c => c.type === 'TEXT');
  const voiceChannels = activeServer.channels.filter(c => c.type === 'VOICE');

  return (
    <div className="w-60 bg-gray-800 flex flex-col h-full shrink-0">
      {/* Server Header */}
      <div className="h-12 border-b border-gray-900 flex items-center justify-between px-4 hover:bg-gray-700 cursor-pointer transition-colors shrink-0 shadow-sm">
        <h1 className="font-bold text-white truncate">{activeServer.name}</h1>
        <ChevronDown size={18} className="text-gray-300" />
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
        {/* Text Channels */}
        {textChannels.length > 0 && (
          <div>
            <div className="flex items-center text-gray-400 hover:text-gray-200 text-xs font-bold uppercase tracking-wider mb-1 px-1 cursor-pointer">
              <ChevronDown size={12} className="mr-1" />
              Text Channels
            </div>
            <div className="space-y-[2px]">
              {textChannels.map((channel) => (
                <div 
                  key={channel.id} 
                  onClick={() => setActiveChannel(channel.id)}
                  className={clsx(
                    "flex items-center px-2 py-1.5 rounded cursor-pointer group",
                    activeChannelId === channel.id ? "bg-gray-700/60 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  )}
                >
                  <Hash size={18} className={clsx("mr-1.5", activeChannelId === channel.id ? "text-gray-300" : "text-gray-400 group-hover:text-gray-300")} />
                  <span className="truncate">{channel.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice Channels */}
        {voiceChannels.length > 0 && (
          <div>
            <div className="flex items-center text-gray-400 hover:text-gray-200 text-xs font-bold uppercase tracking-wider mb-1 px-1 cursor-pointer">
              <ChevronDown size={12} className="mr-1" />
              Voice Channels
            </div>
            <div className="space-y-[2px]">
              {voiceChannels.map((channel) => (
                <div 
                  key={channel.id} 
                  className="flex items-center px-2 py-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 cursor-pointer group"
                >
                  <Volume2 size={18} className="mr-1.5 text-gray-400 group-hover:text-gray-300" />
                  <span className="truncate">{channel.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Controls Panel */}
      <div className="h-[52px] bg-gray-900 flex items-center px-2 justify-between shrink-0">
        <div className="flex items-center hover:bg-gray-700 p-1 rounded cursor-pointer max-w-[120px]">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">{user?.name?.substring(0, 2).toUpperCase()}</span>
          </div>
          <div className="ml-2 truncate flex-1">
            <div className="text-white text-sm font-semibold truncate leading-tight">{user?.name}</div>
            <div className="text-gray-400 text-xs truncate leading-tight">#1234</div>
          </div>
        </div>
        
        <div className="flex items-center text-gray-400">
          <button className="p-1.5 hover:bg-gray-700 hover:text-gray-200 rounded transition-colors">
            <Mic size={18} />
          </button>
          <button className="p-1.5 hover:bg-gray-700 hover:text-gray-200 rounded transition-colors">
            <Headphones size={18} />
          </button>
          <button className="p-1.5 hover:bg-gray-700 hover:text-gray-200 rounded transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelSidebar;
