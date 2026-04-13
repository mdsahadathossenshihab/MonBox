import React, { useState, useEffect } from 'react';
import { useChat } from '../ChatProvider';
import { 
  User as UserIcon, Camera, LogOut, ArrowLeft, Shield, Bell, 
  Moon, HelpCircle, Trash2, Check, Save, Mail, Heart, 
  ChevronRight, Calendar, UserCircle, Settings as SettingsIcon,
  Sparkles, MapPin, Volume2, Smartphone, Monitor, Info,
  Archive, Ban, ShieldAlert, UserMinus, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Chat, User } from '../types';

type SettingsView = 'main' | 'profile' | 'notifications' | 'privacy' | 'appearance' | 'help';

export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const { 
    currentUser, updateUserProfile, logout, deleteAccount, 
    chats, toggleArchive, toggleBlock, toggleRestrict, setActiveChat 
  } = useChat();
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  
  // Profile State
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(currentUser?.gender || 'male');
  const [dob, setDob] = useState(currentUser?.dob || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  
  // Notification State
  const [notifications, setNotifications] = useState({
    sound: true,
    vibration: true,
    preview: true
  });

  // Appearance State
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile({ displayName, bio, gender, dob, address });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderMainSettings = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Profile Summary Card */}
      <div 
        onClick={() => setCurrentView('profile')}
        className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-5 flex items-center justify-between group cursor-pointer hover:border-monbox-teal/30 transition-all teal-glow"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`} 
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 shadow-2xl"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-monbox-teal rounded-full border-2 border-slate-950 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{currentUser?.displayName}</h3>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Account & Identity</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-monbox-teal transition-colors" />
      </div>

      {/* Settings Options */}
      <div className="grid grid-cols-1 gap-2">
        <SettingsOption 
          icon={<Bell className="w-4.5 h-4.5" />} 
          title="Notifications" 
          subtitle="Sound & Vibration"
          onClick={() => setCurrentView('notifications')}
        />
        <SettingsOption 
          icon={<Shield className="w-4.5 h-4.5" />} 
          title="Privacy & Security" 
          subtitle="Blocked & Restricted"
          onClick={() => setCurrentView('privacy')}
        />
        <SettingsOption 
          icon={<Moon className="w-4.5 h-4.5" />} 
          title="Appearance" 
          subtitle="Themes & Layout"
          onClick={() => setCurrentView('appearance')}
        />
        <SettingsOption 
          icon={<HelpCircle className="w-4.5 h-4.5" />} 
          title="Help & Support" 
          subtitle="FAQ & Contact"
          onClick={() => setCurrentView('help')}
        />
      </div>

      {/* Logout Button */}
      <button 
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-4 bg-rose-500/5 border border-rose-500/10 text-rose-500 font-bold rounded-[1.5rem] hover:bg-rose-500 hover:text-white transition-all active:scale-95 text-xs"
      >
        <LogOut className="w-4 h-4" />
        Logout Session
      </button>
    </motion.div>
  );

  const renderProfileSettings = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl teal-glow">
        <div className="flex flex-col items-center mb-8">
          <div className="relative group mb-3">
            <img 
              src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`} 
              className="w-24 h-24 rounded-[2.5rem] object-cover border-4 border-white/5 shadow-2xl group-hover:opacity-90 transition-opacity"
            />
            <button className="absolute bottom-0 right-0 p-2.5 bg-monbox-teal text-white rounded-xl shadow-2xl hover:bg-monbox-teal-light transition-all active:scale-95 teal-glow">
              <Camera className="w-4.5 h-4.5" />
            </button>
          </div>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Identity Avatar</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input 
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-monbox-teal/30 focus:border-monbox-teal/50 transition-all font-medium text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-monbox-teal/30 focus:border-monbox-teal/50 transition-all font-medium text-xs appearance-none cursor-pointer"
              >
                <option value="male" className="bg-slate-900">Male</option>
                <option value="female" className="bg-slate-900">Female</option>
                <option value="other" className="bg-slate-900">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Birth Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                <input 
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-monbox-teal/30 focus:border-monbox-teal/50 transition-all font-medium text-xs [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Residential Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input 
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-monbox-teal/30 focus:border-monbox-teal/50 transition-all font-medium text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">About / Bio</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-monbox-teal/30 focus:border-monbox-teal/50 transition-all font-medium text-xs resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-monbox-teal text-white font-bold rounded-2xl shadow-xl shadow-monbox-teal/20 hover:bg-monbox-teal-light transition-all active:scale-95 disabled:opacity-50 text-xs"
          >
            {loading ? 'Updating...' : success ? <><Check className="w-4 h-4" /> Profile Updated</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-500/5 border border-rose-500/10 rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-500">Danger Zone</h3>
            <p className="text-[8px] font-black text-rose-500/50 uppercase tracking-widest">Account Deletion</p>
          </div>
        </div>
        
        {!showDeleteConfirm ? (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 bg-white/5 border border-rose-500/20 text-rose-500 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 text-xs"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] text-rose-400 font-bold text-center bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">Irreversible action. All data will be purged.</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="py-3 bg-white/5 text-slate-400 font-bold rounded-xl hover:bg-white/10 transition-all text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={deleteAccount}
                className="py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/40 text-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderPrivacySettings = () => {
    const blockedChats = chats.filter(c => c.blockedBy?.includes(currentUser?.uid || ''));
    const restrictedChats = chats.filter(c => c.restrictedBy?.includes(currentUser?.uid || ''));
    const archivedChats = chats.filter(c => c.archivedBy?.includes(currentUser?.uid || ''));

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <PrivacySection 
          title="Blocked Identities" 
          icon={<Ban className="w-4 h-4 text-rose-500" />}
          chats={blockedChats}
          onAction={(id) => toggleBlock(id)}
          actionIcon={<RotateCcw className="w-4 h-4" />}
          actionLabel="Unblock"
        />
        <PrivacySection 
          title="Restricted Boxes" 
          icon={<ShieldAlert className="w-4 h-4 text-amber-500" />}
          chats={restrictedChats}
          onAction={(id) => toggleRestrict(id)}
          actionIcon={<RotateCcw className="w-4 h-4" />}
          actionLabel="Unrestrict"
          onOpenChat={(chat) => {
            setActiveChat(chat);
            onBack();
          }}
        />
        <PrivacySection 
          title="Archived Sessions" 
          icon={<Archive className="w-4 h-4 text-monbox-teal" />}
          chats={archivedChats}
          onAction={(id) => toggleArchive(id)}
          actionIcon={<RotateCcw className="w-4 h-4" />}
          actionLabel="Unarchive"
        />
      </motion.div>
    );
  };

  const renderNotificationSettings = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 space-y-6 teal-glow">
        <ToggleOption 
          icon={<Volume2 className="w-5 h-5" />}
          title="Sound Alerts"
          active={notifications.sound}
          onToggle={() => setNotifications(prev => ({ ...prev, sound: !prev.sound }))}
        />
        <ToggleOption 
          icon={<Smartphone className="w-5 h-5" />}
          title="Vibration"
          active={notifications.vibration}
          onToggle={() => setNotifications(prev => ({ ...prev, vibration: !prev.vibration }))}
        />
        <ToggleOption 
          icon={<Mail className="w-5 h-5" />}
          title="Message Preview"
          active={notifications.preview}
          onToggle={() => setNotifications(prev => ({ ...prev, preview: !prev.preview }))}
        />
      </div>
    </motion.div>
  );

  const renderAppearanceSettings = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 space-y-4 teal-glow">
        <ThemeOption 
          icon={<Moon className="w-5 h-5" />}
          title="Dark Atmospheric"
          active={theme === 'dark'}
          onClick={() => setTheme('dark')}
        />
        <ThemeOption 
          icon={<Sparkles className="w-5 h-5" />}
          title="Light Premium"
          active={theme === 'light'}
          onClick={() => setTheme('light')}
        />
        <ThemeOption 
          icon={<Monitor className="w-5 h-5" />}
          title="System Default"
          active={theme === 'system'}
          onClick={() => setTheme('system')}
        />
      </div>
    </motion.div>
  );

  const renderHelpSettings = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 space-y-6 teal-glow text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-monbox-teal/10 flex items-center justify-center mx-auto mb-4">
          <Info className="w-10 h-10 text-monbox-teal" />
        </div>
        <h3 className="text-xl font-bold text-white">MonBox Support</h3>
        <p className="text-sm text-slate-500 leading-relaxed">Need help with your secure sessions? Our team is available 24/7 to ensure your privacy.</p>
        <div className="pt-4 space-y-3">
          <button className="w-full py-4 bg-monbox-teal text-white font-bold rounded-2xl hover:bg-monbox-teal-light transition-all">Visit Help Center</button>
          <button className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Contact Support</button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 flex flex-col bg-[#020617] h-screen relative overflow-hidden">
      {/* Background Atmospheric Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-monbox-teal/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <div className="h-20 bg-slate-900/40 backdrop-blur-3xl border-b border-white/5 px-8 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-5">
          <button 
            onClick={currentView === 'main' ? onBack : () => setCurrentView('main')}
            className="p-2.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tighter font-display">
              {currentView === 'main' ? 'Settings' : 
               currentView === 'profile' ? 'Profile Identity' :
               currentView === 'privacy' ? 'Privacy Control' :
               currentView === 'notifications' ? 'Alert Settings' :
               currentView === 'appearance' ? 'Visual Theme' : 'Help & Support'}
            </h2>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">
              {currentView === 'main' ? 'MonBox Configuration' : 'Secure Management'}
            </p>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center teal-glow">
          <SettingsIcon className="w-6 h-6 text-monbox-teal" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {currentView === 'main' && renderMainSettings()}
            {currentView === 'profile' && renderProfileSettings()}
            {currentView === 'privacy' && renderPrivacySettings()}
            {currentView === 'notifications' && renderNotificationSettings()}
            {currentView === 'appearance' && renderAppearanceSettings()}
            {currentView === 'help' && renderHelpSettings()}
          </AnimatePresence>

          <div className="text-center py-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-full mb-4">
              <Heart className="w-3 h-3 text-monbox-teal fill-monbox-teal/20" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">MonBox Atmospheric v2.2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsOption({ icon, title, subtitle, onClick }: { icon: React.ReactNode, title: string, subtitle: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-4 flex items-center justify-between group hover:border-monbox-teal/30 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-slate-500 group-hover:text-monbox-teal group-hover:bg-monbox-teal/10 transition-all">
          {icon}
        </div>
        <div className="text-left">
          <h4 className="text-xs font-bold text-white group-hover:text-monbox-teal transition-colors">{title}</h4>
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-monbox-teal transition-colors" />
    </button>
  );
}

function PrivacySection({ title, icon, chats, onAction, actionIcon, actionLabel, onOpenChat }: { title: string, icon: React.ReactNode, chats: Chat[], onAction: (id: string) => void, actionIcon: React.ReactNode, actionLabel: string, onOpenChat?: (chat: Chat) => void }) {
  const { currentUser } = useChat();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        {icon}
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</h3>
        <span className="ml-auto text-[10px] font-black text-slate-700">{chats.length}</span>
      </div>
      <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
        {chats.length > 0 ? (
          <div className="divide-y divide-white/5">
            {chats.map(chat => {
              const otherId = chat.participants.find(id => id !== currentUser?.uid);
              const details = chat.participantDetails?.[otherId!];
              return (
                <div key={chat.id} className="p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                  <div 
                    className={cn("flex items-center gap-3", onOpenChat && "cursor-pointer")}
                    onClick={() => onOpenChat?.(chat)}
                  >
                    <img src={details?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`} className="w-10 h-10 rounded-xl border border-white/10" />
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-monbox-teal transition-colors">{details?.displayName || 'Unknown Box'}</p>
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Secure Identity</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onAction(chat.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-monbox-teal text-slate-400 hover:text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-widest"
                  >
                    {actionIcon} {actionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No entries found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleOption({ icon, title, active, onToggle }: { icon: React.ReactNode, title: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", active ? "bg-monbox-teal/10 text-monbox-teal" : "bg-white/5 text-slate-600")}>
          {icon}
        </div>
        <p className="text-sm font-bold text-white">{title}</p>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "w-12 h-6 rounded-full relative transition-all duration-300",
          active ? "bg-monbox-teal" : "bg-slate-800"
        )}
      >
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-lg",
          active ? "left-7" : "left-1"
        )} />
      </button>
    </div>
  );
}

function ThemeOption({ icon, title, active, onClick }: { icon: React.ReactNode, title: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl flex items-center justify-between border transition-all",
        active ? "bg-monbox-teal/10 border-monbox-teal text-white" : "bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10"
      )}
    >
      <div className="flex items-center gap-4">
        {icon}
        <p className="text-xs font-bold">{title}</p>
      </div>
      {active && <Check className="w-4 h-4 text-monbox-teal" />}
    </button>
  );
}
