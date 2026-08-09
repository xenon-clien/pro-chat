import { useState, useEffect } from 'react';
import { Hash, Search, Bell, Pin, Users, Inbox, HelpCircle, Plus, Smile, Gift, FileImage } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useMessageStore } from '../../store/useMessageStore';
import { useSocket } from '../../hooks/useSocket';

const ChatArea = () => {
  const { activeServerId, activeChannelId, servers } = useServerStore();
  const { messages, fetchMessages, sendMessage, isLoading } = useMessageStore();
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const activeServer = servers.find(s => s.id === activeServerId);
  const activeChannel = activeServer?.channels.find(c => c.id === activeChannelId);

  useSocket(activeChannelId || '');

  useEffect(() => {
    if (activeChannelId) {
      fetchMessages(activeChannelId);
    }
  }, [activeChannelId, fetchMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeChannelId) return;

    try {
      await sendMessage(activeChannelId, content);
      setContent('');
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  const handleStubClick = (feature: string) => {
    alert(`${feature} feature coming soon!`);
  };

  if (!activeChannel) {
    return <div className="flex-1 flex flex-col bg-gray-700 min-w-0 items-center justify-center text-gray-400">Select a channel</div>;
  }

  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-700 min-w-0">
      {/* Header */}
      <div className="h-12 border-b border-gray-900/50 flex items-center justify-between px-4 shrink-0 shadow-sm">
        <div className="flex items-center">
          <Hash size={24} className="text-gray-400 mr-2" />
          <span className="text-white font-bold text-base">{activeChannel.name}</span>
        </div>
        
        <div className="flex items-center space-x-4 text-gray-300">
          <Hash size={20} className="hover:text-gray-100 cursor-pointer" onClick={() => handleStubClick('Threads')} />
          <Bell size={20} className="hover:text-gray-100 cursor-pointer" onClick={() => handleStubClick('Notifications')} />
          <Pin size={20} className="hover:text-gray-100 cursor-pointer" onClick={() => handleStubClick('Pinned Messages')} />
          <Users size={20} className="hover:text-gray-100 cursor-pointer text-white" onClick={() => handleStubClick('Member List')} />
          
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search" 
              className="bg-gray-900 text-sm text-gray-200 placeholder-gray-400 rounded px-2 py-1 w-36 focus:w-48 transition-all outline-none"
            />
            <Search size={14} className="absolute right-2 top-1.5 text-gray-400" />
          </div>
          
          <Inbox size={20} className="hover:text-gray-100 cursor-pointer" onClick={() => handleStubClick('Inbox')} />
          <HelpCircle size={20} className="hover:text-gray-100 cursor-pointer" onClick={() => handleStubClick('Help')} />
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col-reverse">
        {isLoading ? (
           <div className="text-gray-400 text-center w-full py-4">Loading messages...</div>
        ) : (
          <>
            {filteredMessages.map((msg) => (
              <div key={msg.id} className="mt-4 group hover:bg-gray-800/40 -mx-4 px-4 py-1 rounded">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0 mt-1 cursor-pointer">
                    <span className="text-white font-bold text-sm">{msg.author.name.substring(0,2).toUpperCase()}</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-baseline">
                      <span className="text-white font-medium hover:underline cursor-pointer mr-2">{msg.author.name}</span>
                      <span className="text-gray-400 text-xs">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-gray-200 text-sm mt-1 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex flex-col items-center justify-center text-center mt-12 mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center mb-4">
                <Hash size={36} className="text-white" />
              </div>
              <h1 className="text-white font-bold text-3xl mb-2">Welcome to #{activeChannel.name}!</h1>
              <p className="text-gray-400">This is the start of the #{activeChannel.name} channel.</p>
            </div>
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 pb-6 pt-2 shrink-0">
        <form onSubmit={handleSubmit} className="bg-gray-600 rounded-lg flex items-start px-4 py-2.5 shadow-sm">
          <button type="button" onClick={() => handleStubClick('Attachments')} className="text-gray-300 hover:text-gray-100 mt-1 cursor-pointer transition-colors bg-gray-500 hover:bg-gray-400 rounded-full p-1 mr-4">
            <Plus size={16} className="text-gray-800 font-bold" />
          </button>
          
          <input 
            type="text" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={`Message #${activeChannel.name}`} 
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-400 outline-none w-full"
            autoComplete="off"
          />
          <button type="submit" className="hidden">Submit</button>
          
          <div className="flex items-center space-x-3 text-gray-300 mt-0.5 ml-4">
            <Gift size={20} className="hover:text-gray-100 cursor-pointer transition-colors" onClick={() => handleStubClick('Gifts')} />
            <FileImage size={20} className="hover:text-gray-100 cursor-pointer transition-colors" onClick={() => handleStubClick('GIFs')} />
            <Smile size={20} className="hover:text-gray-100 cursor-pointer transition-colors" onClick={() => handleStubClick('Emojis')} />
          </div>
        </form>
      </div>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
