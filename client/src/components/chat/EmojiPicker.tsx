import React from 'react';

interface EmojiPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Popular & Reactions',
    emojis: ['😀', '😂', '🔥', '❤️', '👍', '🎉', '🚀', '💯', '✨', '😍', '😎', '🙌', '👀', '💡', '💬', '⚡']
  },
  {
    name: 'Gaming & Fun',
    emojis: ['🎮', '👾', '🕹️', '🏆', '🎯', '🎲', '🤖', '👑', '💎', '🛡️', '⚔️', '🏹', '🪄', '🔮', '🎧', '🎸']
  },
  {
    name: 'Symbols & Gestures',
    emojis: ['👋', '🤝', '✌️', '💪', '🙏', '👏', '⭐', '🌟', '💖', '💥', '🟢', '🔴', '⚠️', '✅', '❌', '🍕']
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, onSelect, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute bottom-16 right-4 z-40 w-72 bg-[#121418] border border-yellow-400/30 rounded-2xl shadow-2xl overflow-hidden p-3 animate-scale-up"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
        <span className="text-xs font-black uppercase tracking-wider text-yellow-400">⚡ Emoji Picker</span>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-yellow-400 text-xs font-bold px-1"
        >
          ✕
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-3">
        {EMOJI_CATEGORIES.map((category) => (
          <div key={category.name}>
            <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
              {category.name}
            </div>
            <div className="grid grid-cols-8 gap-1">
              {category.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSelect(emoji)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-yellow-400/20 hover:border hover:border-yellow-400/40 rounded-lg transition-transform hover:scale-125 text-base"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
