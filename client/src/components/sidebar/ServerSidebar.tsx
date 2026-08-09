import { Plus, Compass } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import clsx from 'clsx';

const ServerSidebar = () => {
  const { servers, activeServerId, setActiveServer } = useServerStore();

  return (
    <div className="w-[72px] h-full bg-gray-900 flex flex-col items-center py-3 space-y-2 z-20 shrink-0">
      {/* Home Button (Direct Messages) */}
      <div className="w-12 h-12 bg-gray-700 hover:bg-brand hover:rounded-2xl rounded-3xl transition-all duration-200 cursor-pointer flex items-center justify-center overflow-hidden">
        <span className="text-white font-bold">Pro</span>
      </div>
      
      <div className="w-8 h-[2px] bg-gray-800 rounded-full mx-auto" />

      {/* Real Servers */}
      {servers.map((server) => (
        <div 
          key={server.id} 
          onClick={() => setActiveServer(server.id)}
          className={clsx(
            "w-12 h-12 hover:bg-brand hover:rounded-2xl rounded-3xl transition-all duration-200 cursor-pointer flex items-center justify-center relative group",
            activeServerId === server.id ? "bg-brand rounded-2xl" : "bg-gray-700"
          )}
        >
          {/* Active/Unread indicator */}
          <div className={clsx(
            "absolute left-0 w-1 bg-white rounded-r-full -ml-3 transition-all duration-200",
            activeServerId === server.id ? "h-10" : "h-2 group-hover:h-5"
          )} />
          <span className="text-white text-sm font-semibold truncate w-10 text-center">{server.name.substring(0, 3)}</span>
        </div>
      ))}

      {/* Add Server Button */}
      <div 
        onClick={async () => {
          const name = prompt('Enter a name for your new server:');
          if (name) {
            try {
              await useServerStore.getState().createServer(name);
            } catch (err) {
              alert('Failed to create server. Please try again.');
            }
          }
        }}
        className="w-12 h-12 bg-gray-800 hover:bg-emerald-500 hover:rounded-2xl rounded-3xl transition-all duration-200 cursor-pointer flex items-center justify-center text-emerald-500 hover:text-white mt-2 group"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-200" />
      </div>

      {/* Explore Button */}
      <div className="w-12 h-12 bg-gray-800 hover:bg-emerald-500 hover:rounded-2xl rounded-3xl transition-all duration-200 cursor-pointer flex items-center justify-center text-emerald-500 hover:text-white group">
        <Compass size={24} />
      </div>
    </div>
  );
};

export default ServerSidebar;
