import React, { useState, useRef } from 'react';
import { 
  X, Search, Upload, FileText, Image as ImageIcon, Film, Music, Archive, 
  Code, Send, CheckCircle2, User, Users, Hash, Sparkles, FileUp, ArrowRight 
} from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useMessageStore, type FileAttachment } from '../../store/useMessageStore';
import { useAuthStore } from '../../store/useAuthStore';

interface SendFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientName?: string;
  defaultChannelId?: string;
}

const MOCK_USERS = [
  { id: 'usr-1', name: 'CyberNinja', status: 'online', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja' },
  { id: 'usr-2', name: 'NeonAura', status: 'online', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonAura' },
  { id: 'usr-3', name: 'GlitchMaster', status: 'idle', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GlitchMaster' },
  { id: 'usr-4', name: 'ShadowBlade', status: 'dnd', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowBlade' },
  { id: 'usr-5', name: 'Sam AI Assistant', status: 'online', isBot: true, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SamAI' },
];

export const SendFileModal: React.FC<SendFileModalProps> = ({
  isOpen,
  onClose,
  defaultRecipientName,
  defaultChannelId
}) => {
  const { servers, activeServerId, activeChannelId } = useServerStore();
  const { sendMessage } = useMessageStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<{ id: string; name: string; type: 'user' | 'channel'; avatar?: string } | null>(
    defaultRecipientName 
      ? { id: defaultChannelId || 'dm-' + defaultRecipientName, name: defaultRecipientName, type: 'user' }
      : null
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentServer = servers.find((s) => s.id === activeServerId) || servers[0];
  const allChannels = currentServer?.channels || [];

  // Filter users and channels based on search
  const filteredUsers = MOCK_USERS.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredChannels = allChannels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFilePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="text-cyan-400" size={24} />;
    if (file.type.startsWith('video/')) return <Film className="text-pink-400" size={24} />;
    if (file.type.startsWith('audio/')) return <Music className="text-emerald-400" size={24} />;
    if (file.type.includes('zip') || file.type.includes('tar') || file.type.includes('rar')) return <Archive className="text-yellow-400" size={24} />;
    if (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.json') || file.name.endsWith('.html')) return <Code className="text-indigo-400" size={24} />;
    return <FileText className="text-cyan-400" size={24} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSendFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    // Convert file to base64 data URL for instant relay
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;

      const attachment: FileAttachment = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type || 'application/octet-stream',
        url: dataUrl || URL.createObjectURL(selectedFile),
      };

      const targetChannel = selectedTarget?.type === 'channel'
        ? selectedTarget.id
        : selectedTarget?.id || activeChannelId || 'ch-general';

      const messageText = caption.trim() 
        ? caption 
        : `Sent a file to ${selectedTarget?.name ? `@${selectedTarget.name}` : 'everyone'}: ${selectedFile.name}`;

      await sendMessage(targetChannel, messageText, attachment);

      setIsUploading(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setSelectedFile(null);
        setFilePreview(null);
        setCaption('');
        onClose();
      }, 1400);
    };

    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div 
        className="bg-[#0B0F19] border border-cyan-500/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/10 flex flex-col relative"
        onDragEnter={handleDrag}
      >
        {/* Top Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0e1322]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <FileUp size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide flex items-center gap-1.5">
                Send File to User
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-cyan-400/30">
                  P2P Instant
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">Search member, friend or channel & share files instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* 1. Recipient Search & Selector */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">
              1. Select Recipient (Search user or channel)
            </label>

            {selectedTarget ? (
              <div className="flex items-center justify-between p-2.5 bg-cyan-950/30 border border-cyan-400/40 rounded-2xl">
                <div className="flex items-center space-x-2.5">
                  {selectedTarget.avatar ? (
                    <img src={selectedTarget.avatar} alt="" className="w-7 h-7 rounded-full bg-black/40 border border-cyan-400/30" />
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center text-xs font-bold">
                      #
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      {selectedTarget.name}
                      <span className="text-[10px] text-cyan-400 font-mono">({selectedTarget.type})</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium">Ready for direct file transfer</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTarget(null)}
                  className="text-xs text-gray-400 hover:text-red-400 font-bold px-2 py-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by username (e.g. CyberNinja, NeonAura) or #channel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#121727] text-xs text-white rounded-2xl pl-9 pr-4 py-2.5 border border-white/10 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder-gray-500"
                    autoFocus
                  />
                  <Search size={15} className="absolute left-3 top-3 text-gray-400" />
                </div>

                {/* Search Results Dropdown / Fast List */}
                <div className="bg-[#101423] border border-white/5 rounded-2xl p-2 max-h-36 overflow-y-auto custom-scrollbar space-y-1">
                  <div className="text-[10px] font-bold uppercase text-gray-500 px-2 py-0.5">Online Users & Friends</div>
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedTarget({ id: 'dm-' + u.name, name: u.name, type: 'user', avatar: u.avatar })}
                      className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/20 border border-transparent text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2">
                        <img src={u.avatar} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                        <span className="text-xs font-bold text-gray-200 group-hover:text-cyan-300">{u.name}</span>
                        {u.isBot && <span className="bg-cyan-500/20 text-cyan-400 text-[9px] px-1 rounded font-black">AI</span>}
                      </div>
                      <span className="text-[10px] text-cyan-400 font-bold opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                        Select <ArrowRight size={10} />
                      </span>
                    </button>
                  ))}

                  <div className="text-[10px] font-bold uppercase text-gray-500 px-2 pt-2 pb-0.5 border-t border-white/5">Channels in Server</div>
                  {filteredChannels.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedTarget({ id: c.id, name: '#' + c.name, type: 'channel' })}
                      className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-pink-500/10 hover:border-pink-500/20 border border-transparent text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2">
                        <Hash size={14} className="text-pink-400" />
                        <span className="text-xs font-bold text-gray-200 group-hover:text-pink-300">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-pink-400 font-bold opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                        Select <ArrowRight size={10} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Drag & Drop File Upload Box */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">
              2. Choose or Drop File (Photos, Docs, ZIP, Audio, Code)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-cyan-400 bg-cyan-400/10 scale-[1.01]' 
                    : 'border-white/10 hover:border-cyan-400/50 bg-[#121626] hover:bg-[#151b2e]'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
                  <Upload size={22} className="animate-bounce" />
                </div>
                <div className="text-xs font-black text-white mb-1">
                  Click to Browse or Drag & Drop File Here
                </div>
                <p className="text-[10px] text-gray-400 max-w-xs">
                  Supports Images, Videos, PDFs, ZIP archives, Code files, and Documents up to 50MB
                </p>
              </div>
            ) : (
              <div className="bg-[#121727] border border-cyan-400/40 rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                      {getFileIcon(selectedFile)}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-black text-white truncate">{selectedFile.name}</div>
                      <div className="text-[10px] text-cyan-400 font-mono font-bold">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'File'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-all cursor-pointer"
                    title="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Image Preview if available */}
                {filePreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 max-h-48 flex items-center justify-center">
                    <img src={filePreview} alt="Preview" className="max-h-48 object-contain rounded-2xl" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Optional Caption */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">
              3. Message / Caption (Optional)
            </label>
            <input
              type="text"
              placeholder="Add a message or description with your file..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-[#121727] text-xs text-white rounded-2xl px-4 py-2.5 border border-white/10 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0e1322] flex items-center justify-between">
          <div className="text-[11px] text-gray-400 hidden sm:flex items-center gap-1.5">
            <Sparkles size={12} className="text-cyan-400" />
            <span>Encrypted WebRTC P2P direct transfer</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSendFile}
              disabled={!selectedFile || isUploading || isSuccess}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                  : selectedFile
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:scale-105 shadow-lg shadow-cyan-400/25'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>File Sent Successfully!</span>
                </>
              ) : isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Uploading & Sending...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send File Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SendFileModal;
