import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Check, CheckCheck, Smile, Trash2, Reply, Play, Pause, Music, FileText, Volume2 } from 'lucide-react';
import { Message } from '../types';
import { cn } from '../lib/utils';
import { useChat } from '../ChatProvider';

const isOnlyEmojis = (str: string) => {
  if (!str) return false;
  const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|\s)+$/;
  return emojiRegex.test(str.trim());
};

const getEmojiCount = (str: string) => {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  return Array.from(segmenter.segment(str.trim())).length;
};

function VoicePlayer({ url }: { url: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>(url);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let currentUrl = url;
    let isBlobUrl = false;

    // Convert Base64 to Blob URL for better compatibility and performance
    if (url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'audio/webm';
        const b64Data = parts[1];
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: mime });
        currentUrl = URL.createObjectURL(blob);
        isBlobUrl = true;
        setAudioUrl(currentUrl);
      } catch (e) {
        console.error('VoicePlayer: Error converting base64 to blob', e);
      }
    }

    const audio = new Audio(currentUrl);
    audioRef.current = audio;
    audio.volume = 1.0;
    audio.muted = false;
    audio.preload = 'metadata';

    const setAudioData = () => {
      console.log('VoicePlayer: Audio metadata loaded, duration:', audio.duration);
      if (audio.duration === Infinity) {
        // Some browsers return Infinity for webm without duration metadata
        // We can try to seek to a very large value to force duration calculation
        audio.currentTime = 1e10;
        audio.addEventListener('timeupdate', function getDuration() {
          audio.currentTime = 0;
          audio.removeEventListener('timeupdate', getDuration);
          setDuration(audio.duration);
        }, { once: true });
      } else {
        setDuration(audio.duration);
      }
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onError = (e: any) => {
      console.error('VoicePlayer: Audio error', e);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    if (audio.readyState >= 1) {
      setAudioData();
    }

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (isBlobUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [url]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('Playback error:', err);
          alert('Could not play audio. Please try downloading it instead.');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 px-1 w-full max-w-[280px] sm:min-w-[280px]">
      <button 
        onClick={togglePlay}
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-xl transition-all flex-shrink-0 shadow-lg active:scale-90",
          isPlaying ? "bg-white text-slate-950" : "bg-white/10 text-white hover:bg-white/20",
          !audioRef.current && "opacity-50 cursor-not-allowed"
        )}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-blue-500 absolute left-0 top-0 transition-all duration-100 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-end gap-0.5 h-2.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={cn(
                  "w-0.5 bg-blue-500/40 rounded-full transition-all duration-300",
                  isPlaying ? "animate-pulse" : ""
                )} 
                style={{ 
                  height: `${20 + Math.random() * 80}%`,
                  animationDelay: `${i * 100}ms`
                }} 
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono whitespace-nowrap">{formatTime(isPlaying ? currentTime : duration)}</span>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isGroup?: boolean;
  showAvatar?: boolean;
  onImageClick?: (url: string) => void;
  onProfileClick?: () => void;
  onReply?: (replyData: Message['replyTo']) => void;
  key?: string;
}

export default function MessageBubble({ message, isMe, isGroup, showAvatar, onImageClick, onProfileClick, onReply }: MessageBubbleProps) {
  const { activeChat, addReaction, deleteMessage, currentUser } = useChat();
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('top');
  const bubbleRef = useRef<HTMLDivElement>(null);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);

  const otherUser = !isMe ? activeChat?.participantDetails?.[message.senderId] : null;

  useEffect(() => {
    if ((showEmojiSelector || showDeleteConfirm) && bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      if (rect.top < 250) {
        setMenuPosition('bottom');
      } else {
        setMenuPosition('top');
      }
    }
  }, [showEmojiSelector, showDeleteConfirm]);

  const handleTouchStart = () => {
    touchTimer.current = setTimeout(() => {
      setShowOptions(true);
      setShowEmojiSelector(true);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const reactions = [
    { emoji: '👍', label: 'Like' },
    { emoji: '❤️', label: 'Love' },
    { emoji: '😂', label: 'Haha' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '🔥', label: 'Fire' },
  ];

  const handleReaction = (emoji: string) => {
    addReaction(message.id, emoji);
    setShowEmojiSelector(false);
  };

  const handleDelete = async (mode: 'me' | 'everyone') => {
    await deleteMessage(message.id, mode);
    setShowDeleteConfirm(false);
  };

  if (message.isDeleted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex w-full gap-2 sm:gap-4 group relative mb-4",
          isMe ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div className="w-10 flex-shrink-0" />
        <div className={cn(
          "px-4 py-2 rounded-2xl text-[10px] font-bold border flex items-center gap-2",
          isMe ? "bg-slate-900/20 border-white/5 text-slate-500/80" : "bg-slate-900/20 border-white/5 text-slate-500/80"
        )}>
          <Trash2 className="w-3 h-3 opacity-50" />
          <span className="italic tracking-wider">This message was deleted</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      ref={bubbleRef}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full gap-2 sm:gap-4 group relative",
        isMe ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => {
        setShowOptions(false);
        setShowEmojiSelector(false);
        setShowDeleteConfirm(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      {/* Avatar */}
      <div className="w-10 flex-shrink-0">
        {!isMe && showAvatar && (
          <img 
            src={otherUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-2xl border-2 border-white/10 mt-1 shadow-lg object-cover cursor-pointer hover:scale-105 transition-transform"
            onClick={onProfileClick}
          />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[85%] sm:max-w-[70%]",
        isMe ? "items-end" : "items-start"
      )}>
        <div className="relative group/bubble">
          {/* Reaction Selector Popup */}
          <AnimatePresence>
            {showEmojiSelector && (
              <motion.div 
                initial={{ opacity: 0, y: menuPosition === 'top' ? 10 : -10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: menuPosition === 'top' ? 10 : -10, scale: 0.8 }}
                className={cn(
                  "absolute z-20 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex gap-1.5 shadow-2xl",
                  menuPosition === 'top' ? "bottom-full mb-3" : "top-full mt-3",
                  isMe ? "right-0" : "left-0"
                )}
              >
                {reactions.map(r => (
                  <button 
                    key={r.emoji}
                    onClick={() => handleReaction(r.emoji)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-all hover:scale-125 text-xl active:scale-90"
                  >
                    {r.emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirm Popup */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: menuPosition === 'top' ? 10 : -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: menuPosition === 'top' ? 10 : -10 }}
                className={cn(
                  "absolute z-30 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1.5 w-48",
                  menuPosition === 'top' ? "bottom-full mb-3" : "top-full mt-3",
                  isMe ? "right-0" : "left-0"
                )}
              >
                <button 
                  onClick={() => handleDelete('me')}
                  className="w-full px-4 py-2.5 text-left text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all uppercase tracking-widest"
                >
                  Delete for me
                </button>
                <button 
                  onClick={() => handleDelete('everyone')}
                  className="w-full px-4 py-2.5 text-left text-[10px] font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-all uppercase tracking-widest"
                >
                  Delete for everyone
                </button>
              </motion.div>
            )}
          </AnimatePresence>
 
          {/* Quick Actions */}
          <AnimatePresence>
            {showOptions && !showEmojiSelector && !showDeleteConfirm && (
              <motion.div 
                initial={{ opacity: 0, x: isMe ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isMe ? 10 : -10 }}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 px-3",
                  isMe ? "right-full" : "left-full"
                )}
              >
                <button 
                  onClick={() => setShowEmojiSelector(true)}
                  className="p-2 text-slate-500 hover:text-blue-400 hover:bg-white/5 rounded-xl transition-all active:scale-90"
                >
                  <Smile className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onReply?.({
                    id: message.id,
                    text: message.text || (message.type === 'image' ? '📷 Image' : '🎤 Voice message'),
                    senderName: isMe ? 'You' : (otherUser?.displayName || 'User')
                  })}
                  className="p-2 text-slate-500 hover:text-blue-400 hover:bg-white/5 rounded-xl transition-all active:scale-90"
                >
                  <Reply className="w-4 h-4" />
                </button>
                {isMe && (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bubble */}
          <div className={cn(
            "px-4 py-3 sm:px-5 sm:py-3.5 rounded-[1.75rem] text-sm relative overflow-hidden transition-all duration-300 shadow-xl",
            isMe 
              ? "bg-blue-600 text-white rounded-tr-none border border-white/10" 
              : "bg-slate-800 text-slate-200 rounded-tl-none border border-white/5",
            message.type === 'image' && "p-1.5 sm:p-2",
            message.type === 'voice' && "p-2 sm:p-2.5",
            message.text && isOnlyEmojis(message.text) && getEmojiCount(message.text) <= 3 && "bg-transparent border-none shadow-none px-0 py-0"
          )}>
            {/* Sender Name for Groups */}
            {isGroup && !isMe && showAvatar && (
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-400 mb-1">
                {otherUser?.displayName || 'User'}
              </p>
            )}

            {/* Quoted Message */}
            {message.replyTo && (
              <div className={cn(
                "mb-2 p-2 rounded-xl border-l-4 text-xs font-medium bg-black/10 flex flex-col gap-0.5",
                isMe ? "border-white/40" : "border-blue-500/40"
              )}>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider",
                  isMe ? "text-white/60" : "text-blue-400"
                )}>
                  {message.replyTo.senderName}
                </span>
                <p className="truncate opacity-80">{message.replyTo.text}</p>
              </div>
            )}

            {message.type === 'image' && message.fileUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-inner bg-slate-900/50">
                <img 
                  src={message.fileUrl} 
                  alt="Sent image" 
                  className="max-w-full h-auto max-h-[300px] sm:max-h-[400px] object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-500"
                  onClick={() => onImageClick?.(message.fileUrl!)}
                />
              </div>
            )}

            {message.type === 'text' && message.fileUrl && (
              <div className="mb-2 p-2 bg-white/5 rounded-xl border border-white/10 inline-flex items-center justify-center group/file cursor-pointer hover:bg-white/10 transition-all shadow-inner"
                   onClick={() => window.open(message.fileUrl, '_blank')}>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 group-hover/file:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            )}

            {message.type === 'voice' && message.fileUrl && (
              <VoicePlayer url={message.fileUrl} />
            )}

            {message.text && message.text !== 'Sent an image' && message.text !== 'Voice message' && (
              <p className={cn(
                "whitespace-pre-wrap break-words leading-relaxed font-medium",
                message.type === 'image' && "mt-2 px-2 pb-1",
                isOnlyEmojis(message.text) && getEmojiCount(message.text) === 1 && "text-4xl sm:text-5xl drop-shadow-2xl",
                isOnlyEmojis(message.text) && getEmojiCount(message.text) === 2 && "text-3xl sm:text-4xl drop-shadow-2xl",
                isOnlyEmojis(message.text) && getEmojiCount(message.text) === 3 && "text-2xl sm:text-3xl drop-shadow-2xl"
              )}>
                {message.text}
              </p>
            )}

            {/* Reactions Display */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className={cn(
                "absolute -bottom-3 flex -space-x-1.5",
                isMe ? "right-3" : "left-3"
              )}>
                {Object.entries(message.reactions).map(([uid, emoji]) => (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={uid} 
                    className="bg-slate-900 border border-white/10 rounded-full px-2 py-1 text-xs shadow-2xl"
                    title={`User ${uid.slice(0, 5)} reacted with ${emoji}`}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Meta Info */}
        <div className={cn(
          "flex items-center gap-2 mt-2 px-2",
          isMe ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {message.timestamp ? format(message.timestamp.toDate(), 'HH:mm') : '...'}
          </span>
          {isMe && (
            <span className={cn(
              "transition-colors",
              message.status === 'seen' ? "text-blue-400" : "text-slate-600"
            )}>
              {message.status === 'seen' ? (
                <CheckCheck className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
