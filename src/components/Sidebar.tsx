import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../ChatProvider';
import { Search, LogOut, Plus, Settings, User as UserIcon, Archive, VolumeX, ShieldAlert, Ban, Trash2, Mail, Users, ArrowLeft, MessageSquare, ChevronRight, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { User, Chat } from '../types';
import { cn } from '../lib/utils';
import NotesList from './NotesList';
import { CreateGroupModal } from './CreateGroupModal';

export default function Sidebar({ className, onOpenSettings, onOpenFeedback, onOpenDiscover }: { className?: string, onOpenSettings?: () => void, onOpenFeedback?: () => void, onOpenDiscover?: () => void }) {
  const { 
    currentUser, chats, activeChat, setActiveChat, logout, searchUsers, startChat,
    toggleArchive, toggleMute, toggleBlock, toggleRestrict, markAsUnread, deleteChat,
    users, allUsers
  } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'groups' | 'archived'>('all');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, chatId: string } | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm) {
        setIsSearching(true);
        const results = await searchUsers(searchTerm);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const filteredChats = chats.filter(chat => {
    if (chat.deletedBy?.includes(currentUser?.uid || '')) return false;
    
    const isArchived = chat.archivedBy?.includes(currentUser?.uid || '');
    const isRestricted = chat.restrictedBy?.includes(currentUser?.uid || '');
    const isUnread = (chat.unreadCount?.[currentUser?.uid || ''] || 0) > 0;
    
    if (activeTab === 'archived') return isArchived;
    if (isArchived || isRestricted) return false;
    
    if (activeTab === 'unread') return isUnread;
    if (activeTab === 'groups') return chat.isGroup;
    
    return true;
  });

  return (
    <div className={cn("flex flex-col bg-[#020617] border-r border-white/5 h-screen w-full max-w-md relative overflow-hidden", className)}>
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-monbox-teal/20 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <div className="p-5 pb-2 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-monbox-teal flex items-center justify-center shadow-2xl shadow-monbox-teal/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <MessageSquare className="w-5 h-5 text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tighter font-display">MonBox</h1>
            <div className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-monbox-teal animate-pulse" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Secure</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button 
            onClick={onOpenDiscover}
            className="p-2 text-slate-500 hover:text-monbox-teal hover:bg-white/5 rounded-xl transition-all"
            title="Discover"
          >
            <Users className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={() => setIsGroupModalOpen(true)}
            className="p-2 text-slate-500 hover:text-monbox-teal hover:bg-white/5 rounded-xl transition-all"
            title="New Group"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Stories Section */}
      <div className="px-5 relative z-10">
        <NotesList />
      </div>

      {/* Search */}
      <div className="px-5 py-2 relative z-10">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 group-focus-within:text-monbox-teal transition-colors" />
          <input 
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-monbox-teal/30 focus:border-monbox-teal/40 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-5 mb-3 gap-1.5 overflow-x-auto no-scrollbar relative z-10">
        {(['all', 'unread', 'groups', 'archived'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap border",
              activeTab === tab 
                ? "bg-monbox-teal text-white border-monbox-teal shadow-xl shadow-monbox-teal/20" 
                : "text-slate-500 border-white/5 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-24 relative z-10">
        {searchTerm && searchResults.length > 0 && (
          <div className="mb-8 px-4">
            <p className="py-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Global Search</p>
            <div className="space-y-2">
              {searchResults.map(user => (
                <button
                  key={user.uid}
                  onClick={() => {
                    startChat(user);
                    setSearchTerm('');
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-monbox-teal/30 transition-all group"
                >
                  <div className="relative">
                    <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                    {user.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-bold text-white group-hover:text-monbox-teal transition-colors">{user.displayName}</h3>
                    <p className="text-[10px] text-slate-500 truncate">{user.bio || 'Available'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filteredChats.length > 0 ? (
            filteredChats.map(chat => {
              const otherUserId = chat.participants.find(id => id !== currentUser?.uid);
              const nickname = otherUserId ? chat.nicknames?.[otherUserId] : null;
              const details = chat.isGroup 
                ? { displayName: chat.name, photoURL: chat.groupPhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.id}` }
                : chat.participantDetails?.[otherUserId!];
              
              if (!details) return null;
              
              const displayName = nickname || details.displayName;
              
              const isSelected = activeChat?.id === chat.id;
              const unreadCount = chat.unreadCount?.[currentUser?.uid || ''] || 0;
              const isMuted = chat.mutedBy?.includes(currentUser?.uid || '');
              const isOtherRestrictedMe = chat.restrictedBy?.includes(otherUserId || '');

              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, chatId: chat.id });
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 p-5 rounded-[2.5rem] transition-all relative group border",
                    isSelected 
                      ? "bg-monbox-teal text-white border-monbox-teal shadow-2xl shadow-monbox-teal/40" 
                      : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      src={details.photoURL} 
                      className={cn("w-14 h-14 rounded-[1.5rem] object-cover border-2 transition-all", isSelected ? "border-white/30 scale-105" : "border-white/5")} 
                    />
                    {!chat.isGroup && users.find(u => u.uid === otherUserId)?.isOnline && !isOtherRestrictedMe && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={cn("text-sm font-bold truncate", isSelected ? "text-white" : "text-slate-200")}>
                        {displayName}
                      </h3>
                      {chat.updatedAt && (
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", isSelected ? "text-white/60" : "text-slate-600")}>
                          {formatDistanceToNow(chat.updatedAt.toDate(), { addSuffix: false }).replace('about ', '')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-xs truncate flex-1 font-medium", isSelected ? "text-white/80" : "text-slate-500")}>
                        {chat.lastMessage?.senderId === currentUser?.uid && "You: "}
                        {chat.lastMessage?.text || "New conversation"}
                      </p>
                      <div className="flex items-center gap-2">
                        {isMuted && <VolumeX className={cn("w-3 h-3", isSelected ? "text-white/40" : "text-slate-600")} />}
                        {unreadCount > 0 && (
                          <div className={cn(
                            "min-w-[1.25rem] h-5 px-1.5 rounded-full flex items-center justify-center text-[9px] font-black animate-in zoom-in duration-300",
                            isSelected ? "bg-white text-monbox-teal" : "bg-rose-500 text-white shadow-lg shadow-rose-500/40"
                          )}>
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="w-24 h-24 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-slate-800" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">No active boxes</h3>
              <p className="text-slate-600 text-xs leading-relaxed">Your secure conversations will appear here. Start by discovering new people.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent z-20">
        <div className="flex items-center justify-between bg-white/[0.03] backdrop-blur-xl p-4 rounded-[2rem] border border-white/10 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`} 
                className="w-11 h-11 rounded-[1.25rem] border-2 border-white/10 shadow-lg"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white truncate max-w-[100px]">{currentUser?.displayName}</p>
              <p className="text-[9px] font-black text-monbox-teal uppercase tracking-[0.2em]">Secure Session</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onOpenSettings}
              className="p-2.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={logout}
              className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-[101] w-64 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl p-3 overflow-hidden teal-glow"
            >
              <button onClick={() => { toggleArchive(contextMenu.chatId); setContextMenu(null); }} className="w-full flex items-center gap-4 p-4 text-xs font-bold text-slate-300 hover:bg-white/5 rounded-2xl transition-all">
                <Archive className="w-4 h-4 text-monbox-teal" /> Archive Conversation
              </button>
              <button onClick={() => { toggleRestrict(contextMenu.chatId); setContextMenu(null); }} className="w-full flex items-center gap-4 p-4 text-xs font-bold text-slate-300 hover:bg-white/5 rounded-2xl transition-all">
                <ShieldAlert className="w-4 h-4 text-monbox-teal" /> Restrict Box
              </button>
              <button onClick={() => { toggleBlock(contextMenu.chatId); setContextMenu(null); }} className="w-full flex items-center gap-4 p-4 text-xs font-bold text-slate-300 hover:bg-white/5 rounded-2xl transition-all">
                <Ban className="w-4 h-4 text-monbox-teal" /> Block Contact
              </button>
              <button onClick={() => { toggleMute(contextMenu.chatId); setContextMenu(null); }} className="w-full flex items-center gap-4 p-4 text-xs font-bold text-slate-300 hover:bg-white/5 rounded-2xl transition-all">
                <VolumeX className="w-4 h-4 text-monbox-teal" /> Mute Notifications
              </button>
              <div className="h-px bg-white/5 my-2 mx-3" />
              <button onClick={() => { deleteChat(contextMenu.chatId); setContextMenu(null); }} className="w-full flex items-center gap-4 p-4 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all">
                <Trash2 className="w-4 h-4" /> Delete Permanently
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
