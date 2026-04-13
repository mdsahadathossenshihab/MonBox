import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../ChatProvider';
import { Send, Image as ImageIcon, Smile, MoreVertical, Phone, Video, Paperclip, Mic, X, ArrowLeft, Shield, Check, CheckCheck, Play, Pause, Download, Trash2, Heart, MessageSquare, Sparkles, ShieldAlert, Ban, Clock, Info, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Message, Chat } from '../types';
import { cn } from '../lib/utils';
import { CallArea } from './CallArea';

import { ChatInfo } from './ChatInfo';

const THEMES = [
  { 
    id: 'default', 
    name: 'MonBox Dark', 
    color: 'bg-slate-950', 
    accent: 'text-monbox-teal', 
    bubble: 'bg-monbox-teal',
    bg: 'from-slate-950 to-slate-900', 
    pattern: 'radial-gradient(#ffffff 1px, transparent 1px)',
    emoji: '👍'
  },
  { 
    id: 'love', 
    name: 'I Heart You', 
    color: 'bg-rose-900', 
    accent: 'text-rose-300', 
    bubble: 'bg-rose-500',
    bg: 'from-rose-800 to-rose-950', 
    pattern: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 80.7L48.3 79.1C37.2 69.1 30 62.6 30 54.5 30 47.9 35.1 44 41.5 44c3.6 0 7.1 1.7 9.5 4.4 2.4-2.7 5.9-4.4 9.5-4.4 6.4 0 11.5 3.9 11.5 10.5 0 8.1-7.2 14.6-18.3 24.6L50 80.7z\' fill=\'%23fb7185\' fill-opacity=\'0.4\'/%3E%3C/svg%3E")',
    emoji: '❤️'
  },
  { 
    id: 'family', 
    name: 'Family Warmth', 
    color: 'bg-orange-900', 
    accent: 'text-orange-300', 
    bubble: 'bg-orange-600',
    bg: 'from-orange-800 to-orange-950', 
    pattern: 'url("data:image/svg+xml,%3Csvg width=\'120\' height=\'120\' viewBox=\'0 0 120 120\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M60 30l-30 30v30h60v-30l-30-30zm0 15l20 20v20h-40v-20l20-20z\' fill=\'%23fbbf24\' fill-opacity=\'0.3\'/%3E%3C/svg%3E")',
    emoji: '🙏'
  },
  { 
    id: 'friends', 
    name: 'Friends Chill', 
    color: 'bg-sky-900', 
    accent: 'text-sky-300', 
    bubble: 'bg-sky-600',
    bg: 'from-sky-800 to-sky-950', 
    pattern: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'25\' fill=\'%2338bdf8\' fill-opacity=\'0.3\'/%3E%3Cpath d=\'M25 25h50v50h-50z\' fill=\'none\' stroke=\'%2338bdf8\' stroke-opacity=\'0.3\' stroke-width=\'2\'/%3E%3C/svg%3E")',
    emoji: '🔥'
  },
  { 
    id: 'midnight', 
    name: 'Midnight Star', 
    color: 'bg-indigo-950', 
    accent: 'text-indigo-400', 
    bubble: 'bg-indigo-600',
    bg: 'from-indigo-900 to-indigo-950', 
    pattern: 'url("data:image/svg+xml,%3Csvg width=\'120\' height=\'120\' viewBox=\'0 0 120 120\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M60 10l2 48 48 2-48 2-2 48-2-48-48-2 48-2z\' fill=\'%23818cf8\' fill-opacity=\'0.15\'/%3E%3C/svg%3E")',
    emoji: '✨'
  },
  { 
    id: 'nature', 
    name: 'Forest Zen', 
    color: 'bg-emerald-950', 
    accent: 'text-emerald-400', 
    bubble: 'bg-emerald-600',
    bg: 'from-emerald-900 to-emerald-950', 
    pattern: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 10c-8 0-15 7-15 15s7 15 15 15 15-7 15-15-7-15-15-15zm0 5c5 0 10 5 10 10s-5 10-10 10-10-5-10-10 5-10 10-10z\' fill=\'%2334d399\' fill-opacity=\'0.15\'/%3E%3C/svg%3E")',
    emoji: '🌿'
  },
];

export default function ChatArea() {
  const { activeChat, currentUser, sendMessage, uploadFile, users, setActiveChat, deleteMessage, addReaction, messages, toggleBlock, toggleRestrict, updateChatSettings, initiateCall } = useChat();
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!activeChat) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-monbox-teal/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div className="w-40 h-40 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[4rem] flex items-center justify-center mx-auto mb-10 shadow-2xl teal-glow relative group">
            <div className="absolute inset-0 bg-monbox-teal/5 rounded-[4rem] scale-90 group-hover:scale-110 transition-transform duration-700" />
            <MessageSquare className="w-20 h-20 text-monbox-teal relative z-10" />
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-monbox-teal rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tighter font-display">Welcome to MonBox</h2>
          <p className="text-slate-500 max-w-xs mx-auto font-bold text-[10px] uppercase tracking-[0.4em]">Select a conversation to begin your secure experience</p>
        </motion.div>
      </div>
    );
  }

  const otherUserId = activeChat.participants.find(id => id !== currentUser?.uid);
  const isOtherRestrictedMe = activeChat.restrictedBy?.includes(otherUserId || '');
  const isMeRestrictedOther = activeChat.restrictedBy?.includes(currentUser?.uid || '');
  
  // Strict check: If I restricted them, hide the input area entirely.
  // They can only be messaged after unrestricting from Settings.
  
  const details = activeChat.isGroup 
    ? { displayName: activeChat.name, photoURL: activeChat.groupPhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat.id}` }
    : activeChat.participantDetails?.[otherUserId!];

  if (!details) return null;

  const handleSend = async () => {
    if (!inputText.trim() && !selectedFile) return;
    
    const isBlocked = activeChat.blockedBy?.includes(currentUser?.uid || '') || activeChat.blockedBy?.includes(otherUserId || '');
    const isMeRestricted = activeChat.restrictedBy?.includes(currentUser?.uid || '');
    
    if (isBlocked) {
      alert('Cannot send messages in a blocked chat.');
      return;
    }
    
    if (isMeRestrictedOther) {
      alert('You have restricted this user. Unrestrict them from Settings > Privacy to reply.');
      return;
    }
    
    try {
      if (scheduledTime) {
        const scheduleDate = new Date(scheduledTime);
        if (scheduleDate <= new Date()) {
          alert('Scheduled time must be in the future.');
          return;
        }
        // For simplicity in this demo, we'll just add a 'scheduledFor' field
        // In a real app, a cloud function would handle the actual sending
        await sendMessage(inputText, 'text', null, replyingTo?.id, scheduledTime);
        setScheduledTime(null);
        setShowSchedulePicker(false);
      } else if (selectedFile) {
        const fileUrl = await uploadFile(selectedFile, `chats/${activeChat.id}`);
        const type = selectedFile.type.startsWith('image/') ? 'image' : 'text';
        await sendMessage(inputText, type, fileUrl, replyingTo?.id);
        setSelectedFile(null);
        setFilePreview(null);
      } else {
        await sendMessage(inputText, 'text', null, replyingTo?.id);
      }
      setInputText('');
      setReplyingTo(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('handleSend error:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Optimize for lower file size: 16kbps is enough for voice
      const options = {
        audioBitsPerSecond: 16000,
        mimeType: 'audio/webm;codecs=opus'
      };
      
      // Check if the browser supports the specified mimeType
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback if options are not supported
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        
        try {
          const fileUrl = await uploadFile(file, `chats/${activeChat.id}/voice`);
          await sendMessage('', 'voice', fileUrl);
        } catch (error) {
          console.error('Error sending voice message:', error);
          alert('Voice message is too large. Please keep it under 2 minutes.');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          // Limit to 2 minutes (120 seconds) to ensure it fits in Firestore (1MB limit)
          if (prev >= 120) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingAudio(url);
      }
    }
  };

  const filteredMessages = messages?.filter(msg => 
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTheme = THEMES.find(t => t.id === activeChat.theme) || THEMES[0];

  return (
    <div className={cn("flex-1 flex flex-col h-screen relative overflow-hidden transition-colors duration-500", currentTheme.color)}>
      {/* Background Pattern / Custom Image */}
      {activeChat.customBackground ? (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80" 
          style={{ 
            backgroundImage: `url(${activeChat.customBackground})`,
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover'
          }} 
        />
      ) : (
        <>
          <div className={cn("absolute inset-0 opacity-[0.2] pointer-events-none bg-gradient-to-b", currentTheme.bg)} />
          <div className="absolute inset-0 opacity-[0.2] pointer-events-none" style={{ backgroundImage: currentTheme.pattern, backgroundSize: currentTheme.id === 'midnight' ? '120px 120px' : 'auto' }} />
        </>
      )}

      {/* Chat Header */}
      <div className="h-16 bg-slate-900/40 backdrop-blur-3xl border-b border-white/5 px-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveChat(null)}
            className="md:hidden p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative group cursor-pointer" onClick={() => setShowChatInfo(true)}>
            <img 
              src={details.photoURL} 
              className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-2xl group-hover:scale-105 transition-transform"
            />
            {!activeChat.isGroup && users.find(u => u.uid === otherUserId)?.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            )}
          </div>
          <div className="cursor-pointer" onClick={() => setShowChatInfo(true)}>
            <h2 className="text-sm font-bold text-white tracking-tight font-display">
              {activeChat.nicknames?.[otherUserId!] || details.displayName}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-1 h-1 rounded-full", 
                (activeChat.isGroup || (users.find(u => u.uid === otherUserId)?.isOnline && !isOtherRestrictedMe)) ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
              )} />
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2">
                {activeChat.isGroup ? (
                  <>
                    <span>{activeChat.participants.length} Members</span>
                    {activeChat.expiresAt && (
                      <span className="text-rose-500 flex items-center gap-1">
                        <Clock className="w-2 h-2" />
                        Expires {formatDistanceToNow(activeChat.expiresAt.toDate(), { addSuffix: true })}
                      </span>
                    )}
                  </>
                ) : (
                  (users.find(u => u.uid === otherUserId)?.isOnline && !isOtherRestrictedMe) ? 'Online' : 'Offline'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {isSearching && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              className="relative mr-2"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-8 text-xs text-white focus:outline-none focus:border-monbox-teal"
                autoFocus
              />
              <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
          <button 
            onClick={() => setIsSearching(true)}
            className="p-2 text-slate-500 hover:text-monbox-teal hover:bg-white/5 rounded-xl transition-all"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={() => {
              const otherId = activeChat.participants.find(id => id !== currentUser?.uid);
              if (otherId) initiateCall(activeChat.id, otherId, 'video');
            }}
            className="p-2 text-slate-500 hover:text-monbox-teal hover:bg-white/5 rounded-xl transition-all"
          >
            <Video className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={() => {
              const otherId = activeChat.participants.find(id => id !== currentUser?.uid);
              if (otherId) initiateCall(activeChat.id, otherId, 'audio');
            }}
            className="p-2 text-slate-500 hover:text-monbox-teal hover:bg-white/5 rounded-xl transition-all"
          >
            <Phone className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={() => setShowChatInfo(true)}
            className="p-2 text-slate-500 hover:text-monbox-teal hover:bg-white/5 rounded-xl transition-all"
          >
            <Info className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5 relative z-0">
        <div className="flex flex-col items-center justify-center py-8 opacity-30">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 teal-glow">
            <Shield className="w-7 h-7 text-monbox-teal" />
          </div>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Secure Session</p>
        </div>

        {(searchQuery ? filteredMessages : messages)?.map((message, index) => {
          const isMe = message.senderId === currentUser?.uid;
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={message.id} 
              className={cn("flex items-end gap-4", isMe ? "flex-row-reverse" : "flex-row")}
            >
              {!isMe && (
                <div className="w-10 h-10 flex-shrink-0">
                  {showAvatar && (
                    <img 
                      src={activeChat.participantDetails?.[message.senderId]?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`} 
                      className="w-10 h-10 rounded-[1rem] object-cover border border-white/10 shadow-lg"
                    />
                  )}
                </div>
              )}
              
              <div className={cn("max-w-[70%] space-y-2", isMe ? "items-end" : "items-start")}>
                <div className={cn(
                  "relative p-5 rounded-[2.5rem] shadow-2xl transition-all",
                  isMe 
                    ? `${currentTheme.bubble} text-white rounded-br-lg teal-glow` 
                    : "bg-white/[0.03] backdrop-blur-xl text-slate-100 border border-white/10 rounded-bl-lg"
                )}>
                  {/* Reply Preview */}
                  {message.replyTo && (
                    <div className="mb-3 p-3 bg-black/20 rounded-2xl border-l-4 border-monbox-teal/50 text-xs">
                      <p className="opacity-50 font-black uppercase tracking-widest mb-1">Replying to</p>
                      <p className="truncate opacity-80">{messages.find(m => m.id === message.replyTo)?.text || 'Original message'}</p>
                    </div>
                  )}

                  {message.type === 'image' && message.fileUrl && (
                    <div className="mb-4 rounded-3xl overflow-hidden bg-black/20 border border-white/5">
                      <img src={message.fileUrl} className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(message.fileUrl, '_blank')} />
                    </div>
                  )}

                  {message.type === 'voice' && message.fileUrl && (
                    <div className="mb-4 p-3 bg-black/20 rounded-2xl flex items-center gap-3 min-w-[220px]">
                      <button 
                        onClick={() => toggleAudio(message.fileUrl!)}
                        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg"
                      >
                        {playingAudio === message.fileUrl ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                      </button>
                      <div className="flex-1">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: playingAudio === message.fileUrl ? '100%' : '0%' }}
                            transition={{ duration: 30, ease: "linear" }} // Approximation
                            className="h-full bg-monbox-teal" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {message.type === 'file' && message.fileUrl && (
                    <div className="mb-4 rounded-3xl overflow-hidden bg-black/20 border border-white/5">
                      {message.fileType?.startsWith('image/') ? (
                        <img src={message.fileUrl} className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(message.fileUrl, '_blank')} />
                      ) : (
                        <div className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Paperclip className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{message.fileName}</p>
                            <p className="text-[9px] font-black opacity-50 uppercase tracking-widest">Secure Attachment</p>
                          </div>
                          <button onClick={() => window.open(message.fileUrl, '_blank')} className="p-3 hover:bg-white/10 rounded-xl transition-all">
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                  
                  <div className={cn(
                    "flex items-center gap-2 mt-3",
                    isMe ? "justify-end" : "justify-start"
                  )}>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1")}>
                      {message.scheduledFor && <Clock className="w-2.5 h-2.5" />}
                      {message.timestamp ? format(message.timestamp.toDate(), 'HH:mm') : 'Sending...'}
                    </span>
                    {isMe && (
                      <div className="flex items-center gap-1">
                        {message.status === 'seen' ? (
                          <div className="flex -space-x-1.5">
                            {activeChat.isGroup && message.seenBy ? (
                              message.seenBy
                                .filter(uid => uid !== currentUser?.uid)
                                .slice(0, 3)
                                .map(uid => (
                                  <img 
                                    key={uid}
                                    src={activeChat.participantDetails?.[uid]?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} 
                                    className="w-3 h-3 rounded-full border border-slate-900" 
                                    alt="seen"
                                  />
                                ))
                            ) : (
                              <img 
                                src={details.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`} 
                                className="w-3 h-3 rounded-full border border-white/20" 
                                alt="seen"
                              />
                            )}
                            {activeChat.isGroup && message.seenBy && message.seenBy.filter(uid => uid !== currentUser?.uid).length > 3 && (
                              <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center">
                                <span className="text-[5px] font-bold text-white">+{message.seenBy.filter(uid => uid !== currentUser?.uid).length - 3}</span>
                              </div>
                            )}
                          </div>
                        ) : message.status === 'delivered' ? (
                          <div className="flex -space-x-1">
                            <Check className="w-3 h-3 text-monbox-teal" />
                            <Check className="w-3 h-3 text-monbox-teal" />
                          </div>
                        ) : message.status === 'sent' ? (
                          <Check className="w-3 h-3 text-white/40" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full border border-white/20 border-t-transparent animate-spin" />
                        )}
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-30">
                          {message.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className={cn(
                      "absolute -bottom-4 flex gap-1.5",
                      isMe ? "right-6" : "left-6"
                    )}>
                      {Object.entries(Object.entries(message.reactions).reduce((acc, [uid, emoji]) => {
                        if (!acc[emoji as string]) acc[emoji as string] = [];
                        acc[emoji as string].push(uid);
                        return acc;
                      }, {} as Record<string, string[]>)).map(([emoji, uids]) => (
                        <div key={emoji} className="bg-slate-900 border border-white/10 rounded-full px-2.5 py-1 text-xs shadow-2xl flex items-center gap-1.5 teal-glow">
                          <span>{emoji}</span>
                          <span className="text-[9px] font-black text-monbox-teal">{uids.length}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Message Actions (Hover) */}
                <div className={cn(
                  "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                  isMe ? "flex-row-reverse" : "flex-row"
                )}>
                  <button 
                    onClick={() => addReaction(message.id, '❤️')}
                    className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-white/5 rounded-lg transition-all"
                    title="React"
                  >
                    <Heart className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setReplyingTo(message)}
                    className="p-1.5 text-slate-500 hover:text-monbox-teal hover:bg-white/5 rounded-lg transition-all"
                    title="Reply"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative group/menu">
                    <button className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    <div className={cn(
                      "absolute bottom-full mb-2 hidden group-hover/menu:block z-50 w-40 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-1",
                      isMe ? "right-0" : "left-0"
                    )}>
                      <button 
                        onClick={() => deleteMessage(message.id, 'me')}
                        className="w-full flex items-center gap-2 p-3 text-[10px] font-bold text-slate-300 hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete for me
                      </button>
                      {isMe && (
                        <button 
                          onClick={() => deleteMessage(message.id, 'everyone')}
                          className="w-full flex items-center gap-2 p-3 text-[10px] font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Info Sidebar */}
      <AnimatePresence>
        {showChatInfo && (
          <ChatInfo 
            chat={activeChat} 
            onClose={() => setShowChatInfo(false)} 
            onSearch={() => {
              setShowChatInfo(false);
              setIsSearching(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Input Area */}
      {!isMeRestrictedOther ? (
        <div className="p-8 pt-2 relative z-20">
          <AnimatePresence>
            {replyingTo && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 p-4 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center justify-between teal-glow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-1 h-8 bg-monbox-teal rounded-full" />
                  <div>
                    <p className="text-[9px] font-black text-monbox-teal uppercase tracking-widest">Replying to {replyingTo.senderId === currentUser?.uid ? 'yourself' : 'message'}</p>
                    <p className="text-xs text-slate-400 truncate max-w-md">{replyingTo.text}</p>
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-2 text-slate-500 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {selectedFile && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="mb-6 p-5 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl flex items-center gap-5 teal-glow"
              >
                {filePreview ? (
                  <img src={filePreview} className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Paperclip className="w-8 h-8 text-slate-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready to send</p>
                </div>
                <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
                  <X className="w-6 h-6" />
                </button>
              </motion.div>
            )}

            {showSchedulePicker && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 p-6 bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl teal-glow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-monbox-teal" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest">Schedule Transmission</h4>
                  </div>
                  <button onClick={() => setShowSchedulePicker(false)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input 
                  type="datetime-local" 
                  value={scheduledTime || ''}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-monbox-teal/30 [color-scheme:dark] text-xs font-bold"
                />
                <p className="mt-3 text-[8px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                  Select a future time. The message will be stored and automatically sent at that exact moment.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-2 md:p-3 pr-3 md:pr-4 shadow-2xl flex items-center gap-1 md:gap-3 group focus-within:border-monbox-teal/50 transition-all teal-glow relative overflow-hidden">
            {isRecording && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="absolute inset-0 bg-slate-900 z-30 flex items-center justify-between px-4 md:px-6"
              >
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-white font-bold font-mono text-xs md:text-sm">{formatDuration(recordingDuration)}</span>
                  <span className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest animate-pulse hidden sm:inline">Recording...</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <button 
                    onClick={() => {
                      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
                      setIsRecording(false);
                      if (timerRef.current) clearInterval(timerRef.current);
                      audioChunksRef.current = [];
                    }}
                    className="px-3 md:px-4 py-2 text-rose-500 hover:bg-rose-500/10 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={stopRecording}
                    className="bg-monbox-teal text-white px-4 md:px-6 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-monbox-teal/20 hover:bg-monbox-teal-light transition-all"
                  >
                    Send
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex items-center">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 md:p-4 text-slate-500 hover:text-monbox-teal hover:bg-white/5 rounded-full transition-all"
              >
                <ImageIcon className="w-5 h-5 md:w-7 md:h-7" />
              </button>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  "p-2 md:p-4 rounded-full transition-all",
                  showEmojiPicker ? "text-monbox-teal bg-monbox-teal/10" : "text-slate-500 hover:text-monbox-teal hover:bg-white/5"
                )}
              >
                <Smile className="w-5 h-5 md:w-7 md:h-7" />
              </button>
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "p-2 md:p-4 rounded-full transition-all",
                  isRecording ? "bg-rose-500 text-white animate-pulse" : "text-slate-500 hover:text-monbox-teal hover:bg-white/5"
                )}
              >
                <Mic className="w-5 h-5 md:w-7 md:h-7" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            </div>

            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? `Recording...` : "Message..."}
              disabled={isRecording}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-700 text-xs md:text-sm font-medium py-3 md:py-4"
            />

            <div className="flex items-center gap-1 md:gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                  className={cn(
                    "p-2 md:p-4 rounded-full transition-all",
                    scheduledTime ? "text-monbox-teal bg-monbox-teal/10" : "text-slate-500 hover:text-monbox-teal hover:bg-white/5"
                  )}
                  title="Schedule Message"
                >
                  <Clock className="w-5 h-5 md:w-7 md:h-7" />
                </button>
                {scheduledTime && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 md:w-4 md:h-4 bg-monbox-teal rounded-full flex items-center justify-center animate-bounce">
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => (inputText.trim() || selectedFile) ? handleSend() : sendMessage(activeChat.quickEmoji || '👍', 'text')}
                className={cn(
                  "w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
                  (inputText.trim() || selectedFile) ? "bg-monbox-teal text-white shadow-monbox-teal/40 hover:bg-monbox-teal-light" : "bg-white/5 text-monbox-teal"
                )}
              >
                {(inputText.trim() || selectedFile) ? (
                  scheduledTime ? <Clock className="w-5 h-5 md:w-6 md:h-6" /> : <Send className="w-5 h-5 md:w-6 md:h-6" />
                ) : <span className="text-xl md:text-2xl">{activeChat.quickEmoji || '👍'}</span>}
              </button>
            </div>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-32 left-8 z-[100] animate-in fade-in slide-in-from-bottom-4">
              <EmojiPicker 
                onEmojiClick={(emojiData) => setInputText(prev => prev + emojiData.emoji)}
                theme={Theme.DARK}
                width={350}
                height={450}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 pt-2 relative z-20">
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 text-center teal-glow">
            <p className="text-xs font-bold text-slate-400 mb-2">You have restricted this box.</p>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
              Go to Settings &gt; Privacy &amp; Security to unrestrict and reply.
            </p>
          </div>
        </div>
      )}

      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingAudio(null)}
        className="hidden" 
      />
    </div>
  );
}
