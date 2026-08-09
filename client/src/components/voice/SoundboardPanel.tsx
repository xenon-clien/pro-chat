import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Volume2, VolumeX, Play, Trash2, Music, Plus, Zap } from 'lucide-react';
import clsx from 'clsx';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Sound {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isCustom?: boolean;
  audioDataUrl?: string; // for custom uploaded sounds
  generate?: (ctx: AudioContext, volume: number) => void; // for built-in sounds
}

interface SoundboardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaySound: (sound: Sound) => void; // called to broadcast via socket
  incomingSound?: { soundId: string; soundName: string; audioDataUrl?: string; fromUser: any } | null;
}

// ─── Web Audio Generators ─────────────────────────────────────────────────────
const generateAirHorn = (ctx: AudioContext, vol: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1);
  osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(vol * 0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
  osc.start(); osc.stop(ctx.currentTime + 1.5);
};

const generateSadTrombone = (ctx: AudioContext, vol: number) => {
  const notes = [392, 349, 311, 277]; // G4, F4, Eb4, Db4
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.25);
    gain.gain.setValueAtTime(vol * 0.5, ctx.currentTime + i * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.3);
    osc.start(ctx.currentTime + i * 0.25);
    osc.stop(ctx.currentTime + i * 0.25 + 0.35);
  });
};

const generateTada = (ctx: AudioContext, vol: number) => {
  const chords = [[523, 659, 784], [698, 880, 1047]];
  chords.forEach((chord, ci) => {
    chord.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime + ci * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ci * 0.4 + 0.6);
      osc.start(ctx.currentTime + ci * 0.4);
      osc.stop(ctx.currentTime + ci * 0.4 + 0.7);
    });
  });
};

const generateBaDumTss = (ctx: AudioContext, vol: number) => {
  // Ba (bass drum)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1); gain1.connect(ctx.destination);
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(150, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
  gain1.gain.setValueAtTime(vol, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc1.start(); osc1.stop(ctx.currentTime + 0.15);

  // Dum (snare-ish)
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const gain2 = ctx.createGain();
  src.buffer = buffer;
  src.connect(gain2); gain2.connect(ctx.destination);
  gain2.gain.setValueAtTime(vol * 0.3, ctx.currentTime + 0.35);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
  src.start(ctx.currentTime + 0.35);

  // Tss (hi-hat)
  const buffer2 = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const data2 = buffer2.getChannelData(0);
  for (let i = 0; i < data2.length; i++) data2[i] = Math.random() * 2 - 1;
  const src2 = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = 8000;
  const gain3 = ctx.createGain();
  src2.buffer = buffer2;
  src2.connect(filter); filter.connect(gain3); gain3.connect(ctx.destination);
  gain3.gain.setValueAtTime(vol * 0.4, ctx.currentTime + 0.65);
  gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
  src2.start(ctx.currentTime + 0.65);
};

const generateApplause = (ctx: AudioContext, vol: number) => {
  for (let burst = 0; burst < 8; burst++) {
    const t = burst * 0.12;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1200;
    const gain = ctx.createGain();
    src.buffer = buffer; src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(vol * 0.4, ctx.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.1);
    src.start(ctx.currentTime + t);
  }
};

const generateBruh = (ctx: AudioContext, vol: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.8);
  gain.gain.setValueAtTime(vol * 0.7, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start(); osc.stop(ctx.currentTime + 0.8);
};

const generateLaserBeam = (ctx: AudioContext, vol: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(vol * 0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.start(); osc.stop(ctx.currentTime + 0.5);
};

const generateWoosh = (ctx: AudioContext, vol: number) => {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(200, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.4);
  filter.Q.value = 2;
  const gain = ctx.createGain();
  src.buffer = buffer; src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  gain.gain.setValueAtTime(vol * 0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  src.start(); src.stop(ctx.currentTime + 0.6);
};

const generateLevelUp = (ctx: AudioContext, vol: number) => {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol * 0.25, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.15);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.15);
  });
};

// ─── Default Sounds ───────────────────────────────────────────────────────────
const DEFAULT_SOUNDS: Sound[] = [
  { id: 'airhorn', name: 'Air Horn', emoji: '📯', color: '#FACC15', generate: generateAirHorn },
  { id: 'sadtrombone', name: 'Sad Trombone', emoji: '🎺', color: '#6B7280', generate: generateSadTrombone },
  { id: 'tada', name: 'Tada!', emoji: '🎉', color: '#A855F7', generate: generateTada },
  { id: 'badumtss', name: 'Ba Dum Tss', emoji: '🥁', color: '#F97316', generate: generateBaDumTss },
  { id: 'applause', name: 'Applause', emoji: '👏', color: '#22C55E', generate: generateApplause },
  { id: 'bruh', name: 'Bruh', emoji: '😐', color: '#3B82F6', generate: generateBruh },
  { id: 'laser', name: 'Laser Beam', emoji: '⚡', color: '#EC4899', generate: generateLaserBeam },
  { id: 'woosh', name: 'Woosh', emoji: '💨', color: '#06B6D4', generate: generateWoosh },
  { id: 'levelup', name: 'Level Up', emoji: '⬆️', color: '#84CC16', generate: generateLevelUp },
];

// ─── Component ────────────────────────────────────────────────────────────────
const SoundboardPanel: React.FC<SoundboardPanelProps> = ({
  isOpen,
  onClose,
  onPlaySound,
  incomingSound,
}) => {
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [customSounds, setCustomSounds] = useState<Sound[]>(() => {
    try {
      const stored = localStorage.getItem('soundboard_custom');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [incomingToast, setIncomingToast] = useState<{ soundName: string; fromUser: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Play a built-in generated sound
  const playBuiltIn = useCallback((sound: Sound) => {
    if (isMuted || !sound.generate) return;
    const ctx = getAudioCtx();
    sound.generate(ctx, volume);
  }, [isMuted, volume, getAudioCtx]);

  // Play a custom uploaded sound from data URL
  const playCustom = useCallback(async (audioDataUrl: string) => {
    if (isMuted) return;
    const ctx = getAudioCtx();
    try {
      const response = await fetch(audioDataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = volume;
      src.buffer = audioBuffer;
      src.connect(gain); gain.connect(ctx.destination);
      src.start();
    } catch (e) {
      console.error('Failed to play custom sound', e);
    }
  }, [isMuted, volume, getAudioCtx]);

  // Main play handler
  const handlePlay = useCallback((sound: Sound) => {
    if (playingId === sound.id) return;
    setPlayingId(sound.id);
    setTimeout(() => setPlayingId(null), 1000);

    if (sound.isCustom && sound.audioDataUrl) {
      playCustom(sound.audioDataUrl);
    } else {
      playBuiltIn(sound);
    }

    // Broadcast to others via socket
    onPlaySound({
      ...sound,
      audioDataUrl: sound.isCustom ? sound.audioDataUrl : undefined,
    });
  }, [playingId, playBuiltIn, playCustom, onPlaySound]);

  // Listen for incoming sounds from other users
  useEffect(() => {
    if (!incomingSound) return;
    // Play the sound locally
    if (incomingSound.audioDataUrl) {
      playCustom(incomingSound.audioDataUrl);
    } else {
      const found = DEFAULT_SOUNDS.find(s => s.id === incomingSound.soundId);
      if (found) playBuiltIn(found);
    }
    // Show toast notification
    setIncomingToast({ soundName: incomingSound.soundName, fromUser: incomingSound.fromUser });
    setTimeout(() => setIncomingToast(null), 3000);
  }, [incomingSound]);

  // Handle custom sound file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file (MP3, WAV, OGG, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const newSound: Sound = {
        id: `custom_${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 16),
        emoji: '🎵',
        color: '#FACC15',
        isCustom: true,
        audioDataUrl: dataUrl,
      };
      setCustomSounds(prev => {
        const updated = [...prev, newSound];
        localStorage.setItem('soundboard_custom', JSON.stringify(updated));
        return updated;
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const deleteCustomSound = useCallback((id: string) => {
    setCustomSounds(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('soundboard_custom', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const renameCustomSound = useCallback((id: string, name: string) => {
    setCustomSounds(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, name } : s);
      localStorage.setItem('soundboard_custom', JSON.stringify(updated));
      return updated;
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 left-0 right-0 z-50 mx-3 animate-slide-up">
      {/* Incoming sound toast */}
      {incomingToast && (
        <div className="mb-2 px-4 py-2 bg-yellow-400 text-black rounded-xl font-bold text-sm flex items-center gap-2 shadow-xl animate-slide-up">
          <Music size={14} />
          <span>{incomingToast.fromUser?.name} played <strong>{incomingToast.soundName}</strong></span>
        </div>
      )}

      <div className="bg-[#0D0E12] border border-[#1e222a] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#090A0D] border-b border-[#1e222a]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-yellow-400/10 border border-yellow-400/30 rounded-lg flex items-center justify-center">
              <Music size={14} className="text-yellow-400" />
            </div>
            <span className="text-white font-black text-sm tracking-tight">Soundboard</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-400/15 text-yellow-400 rounded-full font-bold">
              {DEFAULT_SOUNDS.length + customSounds.length} sounds
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Volume slider */}
            <div className="flex items-center gap-2 bg-[#171920] rounded-xl px-3 py-1.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={e => { setVolume(Number(e.target.value)); if (isMuted && Number(e.target.value) > 0) setIsMuted(false); }}
                className="w-20 h-1.5 accent-yellow-400 cursor-pointer"
              />
              <span className="text-xs text-gray-400 font-bold w-7">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#1e222a] rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Built-in Sounds */}
        <div className="p-3">
          <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2 px-1">
            Built-in Sounds
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEFAULT_SOUNDS.map(sound => (
              <SoundButton
                key={sound.id}
                sound={sound}
                isPlaying={playingId === sound.id}
                onPlay={() => handlePlay(sound)}
              />
            ))}
          </div>

          {/* Custom Sounds */}
          {customSounds.length > 0 && (
            <>
              <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2 mt-4 px-1">
                My Sounds
              </div>
              <div className="grid grid-cols-3 gap-2">
                {customSounds.map(sound => (
                  <SoundButton
                    key={sound.id}
                    sound={sound}
                    isPlaying={playingId === sound.id}
                    onPlay={() => handlePlay(sound)}
                    onDelete={() => deleteCustomSound(sound.id)}
                    onRename={(name) => renameCustomSound(sound.id, name)}
                    isCustom
                  />
                ))}
              </div>
            </>
          )}

          {/* Add Custom Sound */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-yellow-400/30 text-yellow-400/70 hover:text-yellow-400 hover:border-yellow-400/60 hover:bg-yellow-400/5 transition-all text-xs font-bold"
          >
            <Plus size={14} />
            Upload Custom Sound
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 bg-[#090A0D] border-t border-[#1e222a] flex items-center gap-1.5">
          <Zap size={10} className="text-yellow-400" />
          <span className="text-[10px] text-gray-600 font-medium">Sounds play for everyone in the voice channel</span>
        </div>
      </div>
    </div>
  );
};

// ─── Sound Button Sub-component ───────────────────────────────────────────────
interface SoundButtonProps {
  sound: Sound;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete?: () => void;
  onRename?: (name: string) => void;
  isCustom?: boolean;
}

const SoundButton: React.FC<SoundButtonProps> = ({ sound, isPlaying, onPlay, onDelete, onRename, isCustom }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sound.name);

  const handleRename = () => {
    if (editName.trim()) {
      onRename?.(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="relative group">
      <button
        onClick={onPlay}
        className={clsx(
          "w-full flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none",
          isPlaying
            ? "bg-yellow-400/20 border-yellow-400 scale-95 shadow-lg shadow-yellow-400/20"
            : "bg-[#171920] border-[#1e222a] hover:border-yellow-400/40 hover:bg-[#1a1d24]"
        )}
      >
        {/* Playing indicator ring */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-xl border-2 border-yellow-400 animate-ping opacity-30 pointer-events-none" />
        )}
        <span className="text-2xl leading-none">{sound.emoji}</span>
        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
            onClick={e => e.stopPropagation()}
            className="w-full text-center text-[10px] font-bold bg-transparent border-b border-yellow-400 text-yellow-400 outline-none"
          />
        ) : (
          <span className={clsx("text-[10px] font-bold leading-tight text-center truncate w-full", isPlaying ? "text-yellow-400" : "text-gray-300")}>
            {sound.name}
          </span>
        )}
        {/* Playing wave animation */}
        {isPlaying && (
          <div className="flex items-end gap-0.5 h-3">
            {[1, 2, 3, 2, 1].map((h, i) => (
              <div
                key={i}
                className="w-0.5 bg-yellow-400 rounded-full animate-bounce"
                style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s`, animationDuration: '0.5s' }}
              />
            ))}
          </div>
        )}
      </button>

      {/* Custom sound controls */}
      {isCustom && !isPlaying && (
        <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="w-5 h-5 bg-[#0D0E12] border border-[#1e222a] rounded text-gray-500 hover:text-yellow-400 flex items-center justify-center text-[9px] font-black transition-colors"
            title="Rename"
          >
            ✏️
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="w-5 h-5 bg-[#0D0E12] border border-[#1e222a] rounded text-gray-500 hover:text-red-400 flex items-center justify-center transition-colors"
            title="Delete"
          >
            <Trash2 size={9} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SoundboardPanel;
