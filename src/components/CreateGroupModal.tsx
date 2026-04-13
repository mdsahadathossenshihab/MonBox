import React, { useState } from 'react';
import { useChat } from '../ChatProvider';
import { X, Users, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const { allUsers, createGroupChat, currentUser } = useChat();
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [groupDuration, setGroupDuration] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!groupName.trim() || selectedParticipants.length === 0) return;
    setIsSubmitting(true);
    try {
      await createGroupChat(groupName, selectedParticipants, groupDuration);
      onClose();
      setGroupName('');
      setSelectedParticipants([]);
      setGroupDuration(0);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleParticipant = (uid: string) => {
    setSelectedParticipants(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-white">Create Group Chat</h3>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Group Name</label>
              <input 
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all mt-1.5"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Auto-Delete Timer</label>
              <select 
                value={groupDuration}
                onChange={(e) => setGroupDuration(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all mt-1.5 appearance-none"
              >
                <option value={0}>No Auto-Delete</option>
                <option value={5}>5 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={1440}>1 Day</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Participants ({selectedParticipants.length})</label>
              <div className="max-h-48 overflow-y-auto custom-scrollbar mt-2 space-y-1 pr-2">
                {allUsers.filter(u => u.uid !== currentUser?.uid).map(user => (
                  <button
                    key={user.uid}
                    onClick={() => toggleParticipant(user.uid)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border",
                      selectedParticipants.includes(user.uid) 
                        ? "bg-blue-600/10 border-blue-500/30" 
                        : "bg-white/[0.02] border-transparent hover:bg-white/[0.05]"
                    )}
                  >
                    <div className="relative">
                      <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-10 h-10 rounded-xl" />
                      {selectedParticipants.includes(user.uid) && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-slate-900">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-white/90">{user.displayName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleCreate}
            disabled={isSubmitting || !groupName.trim() || selectedParticipants.length === 0}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Users className="w-5 h-5" />
                Create Group
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
