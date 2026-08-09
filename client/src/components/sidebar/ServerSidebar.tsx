import React, { useState } from 'react';
import { Plus, Compass, Zap } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useNitroStore } from '../../store/useNitroStore';
import { CreateServerModal } from '../modals/CreateServerModal';
import { NitroModal } from '../modals/NitroModal';
import clsx from 'clsx';

const ServerSidebar = () => {
  const { servers, activeServerId, setActiveServer } = useServerStore();
  const { isNitro } = useNitroStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);

  return (
    <>
      <div className="w-[72px] h-full bg-[#08090B] flex flex-col items-center py-3 space-y-2 z-20 shrink-0 border-r border-[#171920]">
        {/* Home Button (Direct Messages) */}
        <div className="w-12 h-12 bg-[#171920] hover:bg-yellow-400 hover:text-black text-yellow-400 hover:rounded-2xl rounded-3xl transition-all duration-200 cursor-pointer flex items-center justify-center overflow-hidden shadow-lg border border-yellow-400/20 hover:border-yellow-400">
          <span className="font-black text-sm tracking-wider">PRO</span>
        </div>

        {/* Nitro Direct Button */}
        <div
          onClick={() => setIsNitroModalOpen(true)}
          title={isNitro ? "ProChat Nitro Active" : "ProChat Nitro"}
          className={clsx(
            "w-12 h-12 hover:rounded-2xl rounded-3xl transition-all duration-200 cursor-pointer flex items-center justify-center relative group shadow-md",
            isNitro
              ? "bg-gradient-to-tr from-yellow-500/20 to-amber-400/30 text-yellow-400 border border-yellow-400/40 hover:border-yellow-400 hover:scale-105"
              : "bg-[#171920] text-gray-400 hover:bg-yellow-400 hover:text-black border border-transparent hover:border-yellow-400"
          )}
        >
          <Zap size={22} className={clsx(isNitro && "fill-yellow-400 text-yellow-400 animate-pulse")} />
        </div>
        
        <div className="w-8 h-[2px] bg-[#1e222a] rounded-full mx-auto" />

        {/* Real Servers */}
        {servers.map((server) => (
          <div 
            key={server.id} 
            onClick={() => setActiveServer(server.id)}
            title={server.name}
            className={clsx(
              "w-12 h-12 hover:rounded-2xl rounded-3xl transition-all duration-200 cursor-pointer flex items-center justify-center relative group shadow-md overflow-hidden",
              activeServerId === server.id 
                ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#08090B] rounded-2xl shadow-yellow-400/20" 
                : "hover:ring-2 hover:ring-yellow-400/60 hover:ring-offset-1 hover:ring-offset-[#08090B]"
            )}
          >
            {/* Active/Unread indicator pill */}
            <div className={clsx(
              "absolute left-0 w-1 bg-yellow-400 rounded-r-full -ml-3 transition-all duration-200 z-10",
              activeServerId === server.id ? "h-10" : "h-2 group-hover:h-5"
            )} />

            {server.iconUrl ? (
              <img
                src={server.iconUrl}
                alt={server.name}
                className="w-12 h-12 object-cover rounded-3xl group-hover:rounded-2xl transition-all duration-200"
              />
            ) : (
              <div className={clsx(
                "w-12 h-12 flex items-center justify-center text-sm font-black uppercase tracking-tight",
                activeServerId === server.id ? "bg-yellow-400 text-black" : "bg-[#171920] text-gray-200 border border-gray-800 hover:bg-yellow-400 hover:text-black"
              )}>
                {server.name.substring(0, 2)}
              </div>
            )}
          </div>
        ))}

        {/* Add Server Button */}
        <div 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-12 h-12 bg-[#171920] hover:bg-yellow-400 text-yellow-400 hover:text-black hover:rounded-2xl rounded-3xl transition-all duration-200 cursor-pointer flex items-center justify-center mt-2 group border border-yellow-400/30 hover:border-yellow-400 shadow-md shadow-yellow-400/5"
          title="Add a Server"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-200 stroke-[2.5]" />
        </div>

        {/* Explore Button */}
        <div className="w-12 h-12 bg-[#171920] hover:bg-yellow-400 text-gray-400 hover:text-black hover:rounded-2xl rounded-3xl transition-all duration-200 cursor-pointer flex items-center justify-center group border border-transparent hover:border-yellow-400">
          <Compass size={22} />
        </div>
      </div>

      <CreateServerModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <NitroModal
        isOpen={isNitroModalOpen}
        onClose={() => setIsNitroModalOpen(false)}
      />
    </>
  );
};

export default ServerSidebar;

