import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Bell, BellOff, Ban, ShieldAlert, Trash2, Search, 
  Palette, Info, ChevronRight, UserCircle, Edit3, 
  Flag, Shield, Heart, Users, Sparkles, Moon, Sun, 
  Cloud, Zap, Coffee, Music, Camera, Mic, Smile,
  Image as ImageIcon, Check
} from 'lucide-react';
import { useChat } from '../ChatProvider';
import { Chat, User } from '../types';
import { cn } from '../lib/utils';

interface ChatInfoProps {
  chat: Chat;
  onClose: () => void;
  onSearch: () => void;
}

const THEMES = [
  { id: 'default', name: 'MonBox Dark', color: 'bg-slate-950', bubble: 'bg-monbox-teal', emoji: '👍' },
  { id: 'love', name: 'I Heart You', color: 'bg-rose-900', bubble: 'bg-rose-500', emoji: '❤️' },
  { id: 'family', name: 'Family Warmth', color: 'bg-orange-900', bubble: 'bg-orange-600', emoji: '🙏' },
  { id: 'friends', name: 'Friends Chill', color: 'bg-sky-900', bubble: 'bg-sky-600', emoji: '🔥' },
  { id: 'midnight', name: 'Midnight Star', color: 'bg-indigo-950', bubble: 'bg-indigo-600', emoji: '✨' },
  { id: 'nature', name: 'Forest Zen', color: 'bg-emerald-950', bubble: 'bg-emerald-600', emoji: '🌿' },
];

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '🙏', '✨', '💯', '✅'];

export function ChatInfo({ chat, onClose, onSearch }: ChatInfoProps) {
  const { 
    currentUser, toggleMute, toggleBlock, toggleRestrict, 
    deleteChat, updateChatSettings, setNickname, reportChat, uploadFile,
    updateGroupMember, allUsers
  } = useChat();
  const [view, setView] = useState<'main' | 'theme' | 'nickname' | 'report' | 'emoji' | 'members' | 'group_settings' | 'add_member'>('main');
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameValue, setNicknameValue] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isUploadingGroupPhoto, setIsUploadingGroupPhoto] = useState(false);
  const [groupName, setGroupName] = useState(chat.name || '');
  const bgInputRef = React.useRef<HTMLInputElement>(null);
  const groupPhotoInputRef = React.useRef<HTMLInputElement>(null);

  const otherUserId = chat.participants.find(id => id !== currentUser?.uid);
  const details = chat.isGroup 
    ? { displayName: chat.name, photoURL: chat.groupPhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.id}` }
    : chat.participantDetails?.[otherUserId!];
  
  const isMuted = chat.mutedBy?.includes(currentUser?.uid || '');
  const isBlocked = chat.blockedBy?.includes(currentUser?.uid || '');
  const isRestricted = chat.restrictedBy?.includes(currentUser?.uid || '');

  const isAdmin = chat.isGroup && (chat.admins?.includes(currentUser?.uid || '') || chat.createdBy === currentUser?.uid);
  const isModerator = chat.isGroup && chat.moderators?.includes(currentUser?.uid || '');

  const handleSetNickname = async () => {
    if (editingNickname) {
      await setNickname(chat.id, editingNickname, nicknameValue);
      setEditingNickname(null);
      setNicknameValue('');
    }
  };

  const handleReport = async () => {
    if (reportReason.trim()) {
      await reportChat(chat.id, reportReason);
      setReportReason('');
      setView('main');
      alert('Report submitted. Our team will review it.');
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBg(true);
      const base64 = await uploadFile(file, `chats/${chat.id}/background`);
      await updateChatSettings(chat.id, { customBackground: base64 });
      alert('Custom background applied!');
    } catch (error) {
      console.error('Error uploading background:', error);
      alert('Failed to upload background. Please try a smaller image.');
    } finally {
      setIsUploadingBg(false);
    }
  };

  const renderMain = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center pt-4">
        <div className="relative mb-4">
          <img 
            src={details?.photoURL} 
            className="w-24 h-24 rounded-[2.5rem] object-cover border-4 border-white/5 shadow-2xl teal-glow"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-monbox-teal rounded-full border-4 border-slate-950 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">
          {chat.nicknames?.[otherUserId!] || details?.displayName}
        </h3>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Secure Identity</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <QuickAction icon={<Search className="w-5 h-5" />} label="Search" onClick={onSearch} />
        <QuickAction 
          icon={isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />} 
          label={isMuted ? "Unmute" : "Mute"} 
          onClick={() => toggleMute(chat.id)} 
          active={isMuted}
        />
        <QuickAction icon={<Palette className="w-5 h-5" />} label="Theme" onClick={() => setView('theme')} />
      </div>

      {/* Options List */}
      <div className="space-y-1 bg-white/[0.02] border border-white/5 rounded-[2rem] p-2">
        {chat.isGroup && (
          <>
            <OptionItem 
              icon={<Users className="w-4 h-4" />} 
              title="Group Members" 
              onClick={() => setView('members')} 
              trailing={<span className="text-[10px] font-bold text-slate-500">{chat.participants.length}</span>}
            />
            {isAdmin && (
              <OptionItem 
                icon={<Edit3 className="w-4 h-4" />} 
                title="Group Settings" 
                onClick={() => setView('group_settings')} 
              />
            )}
          </>
        )}
        {!chat.isGroup && (
          <OptionItem 
            icon={<Edit3 className="w-4 h-4" />} 
            title="Nicknames" 
            onClick={() => setView('nickname')} 
          />
        )}
        <OptionItem 
          icon={<Smile className="w-4 h-4" />} 
          title="Quick Emoji" 
          onClick={() => setView('emoji')} 
          trailing={<span className="text-lg">{chat.quickEmoji || '👍'}</span>}
        />
        <OptionItem 
          icon={<ShieldAlert className="w-4 h-4" />} 
          title={isRestricted ? "Unrestrict" : "Restrict"} 
          onClick={() => toggleRestrict(chat.id)} 
          danger={!isRestricted}
          active={isRestricted}
        />
        <OptionItem 
          icon={<Ban className="w-4 h-4" />} 
          title={isBlocked ? "Unblock" : "Block"} 
          onClick={() => toggleBlock(chat.id)} 
          danger={!isBlocked}
          active={isBlocked}
        />
        <OptionItem 
          icon={<Flag className="w-4 h-4" />} 
          title="Report" 
          onClick={() => setView('report')} 
          danger 
        />
        <OptionItem 
          icon={<Trash2 className="w-4 h-4" />} 
          title="Delete Chat" 
          onClick={() => {
            if (confirm('Are you sure you want to delete this entire chat?')) {
              deleteChat(chat.id);
              onClose();
            }
          }} 
          danger 
        />
      </div>
    </div>
  );

  const renderTheme = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView('main')} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
        <h3 className="text-sm font-bold text-white">Select Theme</h3>
      </div>

      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Custom Background</p>
        <div className="flex flex-col gap-3">
          <input 
            type="file" 
            ref={bgInputRef} 
            onChange={handleBgUpload} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            onClick={() => bgInputRef.current?.click()}
            disabled={isUploadingBg}
            className="w-full py-3 bg-monbox-teal/10 border border-monbox-teal/20 rounded-xl text-monbox-teal text-xs font-bold hover:bg-monbox-teal/20 transition-all flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            {isUploadingBg ? 'Uploading...' : 'Upload Custom Image'}
          </button>
          {chat.customBackground && (
            <button 
              onClick={() => updateChatSettings(chat.id, { customBackground: '' })}
              className="w-full py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove Custom Image
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {THEMES.map(t => (
          <button 
            key={t.id}
            onClick={() => {
              updateChatSettings(chat.id, { 
                theme: t.id, 
                customBackground: '',
                quickEmoji: t.emoji 
              });
              setView('main');
            }}
            className={cn(
              "p-4 rounded-2xl border transition-all text-left space-y-2 relative overflow-hidden",
              chat.theme === t.id && !chat.customBackground ? "border-monbox-teal bg-monbox-teal/10" : "border-white/5 bg-white/[0.02] hover:border-white/10"
            )}
          >
            <div className={cn("w-8 h-8 rounded-lg shadow-xl", t.bubble)} />
            <p className="text-[10px] font-bold text-white">{t.name}</p>
            <p className="text-lg">{t.emoji}</p>
            {chat.theme === t.id && !chat.customBackground && (
              <div className="absolute top-2 right-2">
                <Check className="w-3 h-3 text-monbox-teal" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderNickname = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView('main')} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
        <h3 className="text-sm font-bold text-white">Edit Nicknames</h3>
      </div>
      <div className="space-y-3">
        {[currentUser?.uid, otherUserId].map(uid => {
          const userDetails = uid === currentUser?.uid ? currentUser : details;
          const isEditing = editingNickname === uid;
          return (
            <div key={uid} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={userDetails?.photoURL || ''} className="w-10 h-10 rounded-xl" />
                <div>
                  <p className="text-xs font-bold text-white">{chat.nicknames?.[uid!] || userDetails?.displayName}</p>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                    {uid === currentUser?.uid ? 'You' : 'Friend'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setEditingNickname(uid!);
                  setNicknameValue(chat.nicknames?.[uid!] || '');
                }}
                className="p-2 hover:bg-monbox-teal/10 text-monbox-teal rounded-xl transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {editingNickname && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-x-0 bottom-0 p-6 bg-slate-900 border-t border-white/10 rounded-t-[2.5rem] z-[60] shadow-2xl"
          >
            <h4 className="text-sm font-bold text-white mb-4">Set Nickname</h4>
            <input 
              type="text"
              value={nicknameValue}
              onChange={(e) => setNicknameValue(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white mb-4 focus:outline-none focus:border-monbox-teal"
              placeholder="Enter nickname..."
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setEditingNickname(null)} className="py-3 bg-white/5 text-slate-400 font-bold rounded-xl">Cancel</button>
              <button onClick={handleSetNickname} className="py-3 bg-monbox-teal text-white font-bold rounded-xl">Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderEmoji = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView('main')} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
        <h3 className="text-sm font-bold text-white">Quick Emoji</h3>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {QUICK_EMOJIS.map(emoji => (
          <button 
            key={emoji}
            onClick={() => {
              updateChatSettings(chat.id, { quickEmoji: emoji });
              setView('main');
            }}
            className={cn(
              "aspect-square flex items-center justify-center text-2xl rounded-2xl border transition-all",
              chat.quickEmoji === emoji ? "bg-monbox-teal/10 border-monbox-teal" : "bg-white/[0.02] border-white/5 hover:border-white/10"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView('main')} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
        <h3 className="text-sm font-bold text-white">Report Session</h3>
      </div>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Why are you reporting this?</p>
      <textarea 
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs min-h-[120px] focus:outline-none focus:border-rose-500 transition-all"
        placeholder="Describe the issue..."
      />
      <button 
        onClick={handleReport}
        className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all"
      >
        Submit Report
      </button>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('main')} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
          <h3 className="text-sm font-bold text-white">Group Members ({chat.participants.length}/20)</h3>
        </div>
        {(isAdmin || isModerator) && chat.participants.length < 20 && (
          <button 
            onClick={() => setView('add_member')}
            className="p-2 bg-monbox-teal/10 text-monbox-teal rounded-xl hover:bg-monbox-teal/20 transition-all"
          >
            <Users className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {chat.participants.map(uid => {
          const user = allUsers.find(u => u.uid === uid);
          const userIsAdmin = chat.admins?.includes(uid) || chat.createdBy === uid;
          const userIsModerator = chat.moderators?.includes(uid);
          const isMe = uid === currentUser?.uid;

          return (
            <div key={uid} className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} className="w-10 h-10 rounded-xl" />
                <div>
                  <p className="text-xs font-bold text-white">{user?.displayName} {isMe && '(You)'}</p>
                  <div className="flex gap-1 mt-0.5">
                    {userIsAdmin && <span className="text-[6px] font-black bg-monbox-teal/20 text-monbox-teal px-1.5 py-0.5 rounded uppercase tracking-widest">Admin</span>}
                    {userIsModerator && <span className="text-[6px] font-black bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-widest">Moderator</span>}
                  </div>
                </div>
              </div>

              {isAdmin && !isMe && (
                <div className="flex gap-1">
                  {!userIsAdmin && (
                    <button 
                      onClick={() => updateGroupMember(chat.id, uid, userIsModerator ? 'remove_moderator' : 'make_moderator')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        userIsModerator ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-slate-500 hover:text-amber-500"
                      )}
                      title={userIsModerator ? "Remove Moderator" : "Make Moderator"}
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button 
                    onClick={() => updateGroupMember(chat.id, uid, 'remove')}
                    className="p-2 bg-white/5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Remove from Group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {isModerator && !isAdmin && !isMe && !userIsAdmin && !userIsModerator && (
                <button 
                  onClick={() => updateGroupMember(chat.id, uid, 'remove')}
                  className="p-2 bg-white/5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAddMember = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView('members')} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
        <h3 className="text-sm font-bold text-white">Add Member</h3>
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {allUsers.filter(u => !chat.participants.includes(u.uid)).map(user => (
          <button 
            key={user.uid}
            onClick={() => {
              updateGroupMember(chat.id, user.uid, 'add');
              setView('members');
            }}
            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex items-center gap-3 hover:bg-white/5 transition-all"
          >
            <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-10 h-10 rounded-xl" />
            <div className="text-left">
              <p className="text-xs font-bold text-white">{user.displayName}</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Available</p>
            </div>
          </button>
        ))}
        {allUsers.filter(u => !chat.participants.includes(u.uid)).length === 0 && (
          <p className="text-center text-slate-500 text-[10px] font-bold py-10">No more users to add</p>
        )}
      </div>
    </div>
  );

  const renderGroupSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView('main')} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
        <h3 className="text-sm font-bold text-white">Group Settings</h3>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <img 
            src={chat.groupPhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.id}`} 
            className="w-24 h-24 rounded-[2.5rem] object-cover border-4 border-white/5 shadow-2xl"
          />
          <button 
            onClick={() => groupPhotoInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
          <input 
            type="file" 
            ref={groupPhotoInputRef} 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setIsUploadingGroupPhoto(true);
              try {
                const base64 = await uploadFile(file, `groups/${chat.id}/photo`);
                await updateChatSettings(chat.id, { groupPhoto: base64 });
              } finally {
                setIsUploadingGroupPhoto(false);
              }
            }} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        
        <div className="w-full space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Group Name</label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-monbox-teal"
              placeholder="Enter group name..."
            />
            <button 
              onClick={() => updateChatSettings(chat.id, { name: groupName })}
              className="px-4 bg-monbox-teal text-white font-bold rounded-xl hover:bg-monbox-teal-light transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-y-0 right-0 w-full md:w-80 bg-slate-950/95 backdrop-blur-3xl border-l border-white/5 z-50 flex flex-col shadow-2xl"
    >
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Box Info</h2>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <AnimatePresence mode="wait">
          {view === 'main' && <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderMain()}</motion.div>}
          {view === 'theme' && <motion.div key="theme" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderTheme()}</motion.div>}
          {view === 'nickname' && <motion.div key="nickname" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderNickname()}</motion.div>}
          {view === 'emoji' && <motion.div key="emoji" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderEmoji()}</motion.div>}
          {view === 'report' && <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderReport()}</motion.div>}
          {view === 'members' && <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderMembers()}</motion.div>}
          {view === 'add_member' && <motion.div key="add_member" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderAddMember()}</motion.div>}
          {view === 'group_settings' && <motion.div key="group_settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderGroupSettings()}</motion.div>}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function QuickAction({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
        active ? "bg-monbox-teal text-white shadow-lg shadow-monbox-teal/20" : "bg-white/[0.03] border border-white/5 text-slate-500 group-hover:text-monbox-teal group-hover:border-monbox-teal/30"
      )}>
        {icon}
      </div>
      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">{label}</span>
    </button>
  );
}

function OptionItem({ icon, title, onClick, danger, active, trailing }: { icon: React.ReactNode, title: string, onClick: () => void, danger?: boolean, active?: boolean, trailing?: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-white/[0.03] transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
          active ? "bg-monbox-teal/10 text-monbox-teal" : (danger ? "bg-rose-500/10 text-rose-500" : "bg-white/5 text-slate-500 group-hover:text-white")
        )}>
          {icon}
        </div>
        <span className={cn(
          "text-[11px] font-bold transition-colors",
          danger ? "text-rose-500" : (active ? "text-monbox-teal" : "text-slate-300 group-hover:text-white")
        )}>
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {trailing}
        <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-500" />
      </div>
    </button>
  );
}
