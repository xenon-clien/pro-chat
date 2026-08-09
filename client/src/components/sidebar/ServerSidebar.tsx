import React, { useState } from 'react';
import { Plus, Compass, Zap, LogOut } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { CreateServerModal } from '../modals/CreateServerModal';
import { NitroModal } from '../modals/NitroModal';
import DiscordNotificationBadge from '../ui/DiscordNotificationBadge';
import clsx from 'clsx';

export const ServerSidebar: React.FC = () => {
  const { servers, activeServerId, setActiveServer } = useServerStore();
  const { logout } = useAuthStore();
  const { isNitro } = useNitroStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);

  return (
    <>
      <div className="w-[72px] h-full bg-[#080A0F] flex flex-col items-center py-3 justify-between z-20 shrink-0 border-r border-[#151A26] select-none">
        {/* Top Server Icons */}
        <div className="flex flex-col items-center space-y-2.5 w-full">
          {/* Lightning Bolt (Direct / Nitro) */}
          <div
            onClick={() => setIsNitroModalOpen(true)}
            title="ProChat Nitro & Direct"
            className="w-12 h-12 bg-[#141926] hover:bg-cyan-400 text-cyan-400 hover:text-black rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center shadow-lg border border-cyan-500/20 hover:border-cyan-400 group"
          >
            <Zap size={22} className="group-hover:scale-110 transition-transform fill-cyan-400/20" />
          </div>

          <div className="w-8 h-[2px] bg-white/10 rounded-full mx-auto" />

          {/* Active Server (Pixel Robot Avatar) */}
          {servers.map((server, index) => {
            const isActive = activeServerId === server.id;
            return (
              <div 
                key={server.id} 
                onClick={() => setActiveServer(server.id)}
                title={server.name}
                className="relative group"
              >
                {/* Active Indicator Bar */}
                <div className={clsx(
                  "absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 bg-cyan-400 rounded-r-full transition-all duration-200 z-10",
                  isActive ? "h-10" : "h-2 group-hover:h-5"
                )} />

                <div className={clsx(
                  "w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center relative shadow-lg overflow-hidden border",
                  isActive 
                    ? "border-cyan-400 ring-2 ring-cyan-400/40 bg-gradient-to-tr from-blue-600 to-cyan-500" 
                    : "bg-[#141926] border-white/10 hover:border-cyan-400/60"
                )}>
                  {/* Pixel Robot Icon matching screenshot */}
                  <img
                    src={server.iconUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${server.name}&backgroundColor=38bdf8`}
                    alt={server.name}
                    className="w-10 h-10 object-contain select-none"
                  />
                </div>
              </div>
            );
          })}

          {/* Add Server Button */}
          <div 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-12 h-12 bg-[#141926] hover:bg-cyan-400 text-cyan-400 hover:text-black rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center group border border-cyan-500/20 hover:border-cyan-400 shadow-md"
            title="Add a Server"
          >
            <Plus size={22} className="group-hover:rotate-90 transition-transform stroke-[2.5]" />
          </div>
        </div>

        {/* Bottom Exit / Logout Button (Matching Arrow in Screenshot) */}
        <div className="w-full flex flex-col items-center">
          <button 
            onClick={logout}
            className="w-12 h-12 bg-[#141926] hover:bg-rose-500 text-gray-400 hover:text-white rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center border border-white/5 hover:border-rose-400 group"
            title="Log Out"
          >
            <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
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
