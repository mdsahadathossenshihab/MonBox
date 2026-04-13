import React from 'react';
import { useChat } from '../ChatProvider';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { User } from '../types';
import { cn } from '../lib/utils';

export default function NotesList() {
  const { currentUser, usersWithNotes, setIsAddingNote, setSelectedNoteUser } = useChat();

  return (
    <div className="px-4 pt-8 pb-3 flex items-center gap-4 overflow-x-auto custom-scrollbar no-scrollbar border-b border-white/5 bg-slate-900/10">
      {/* Current User Note */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="relative">
          <div 
            className={cn(
              "w-12 h-12 rounded-2xl border p-0.5 cursor-pointer transition-all group",
              currentUser?.note ? "border-monbox-teal" : "border-white/10 hover:border-monbox-teal/50"
            )}
            onClick={() => setIsAddingNote(true)}
          >
            <img 
              src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`} 
              alt="My Profile" 
              className="w-full h-full rounded-[0.9rem] object-cover"
            />
            {!currentUser?.note && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-monbox-teal rounded-full border-2 border-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Plus className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          {currentUser?.note && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-slate-950 px-2 py-1 rounded-lg text-[8px] font-bold shadow-2xl whitespace-nowrap max-w-[80px] truncate border border-white/20 z-20"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNoteUser(currentUser);
              }}
            >
              {currentUser.note.text}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rotate-45" />
            </motion.div>
          )}
        </div>
        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">You</span>
      </div>

      {/* Other Users' Notes */}
      {usersWithNotes.filter(u => u.uid !== currentUser?.uid).map(user => (
        <div key={user.uid} className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-2xl border border-monbox-teal/30 p-0.5 cursor-pointer hover:border-monbox-teal transition-all"
              onClick={() => setSelectedNoteUser(user)}
            >
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt={user.displayName} 
                className="w-full h-full rounded-[0.9rem] object-cover"
              />
            </div>
            {user.note && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-xl text-white px-2 py-1 rounded-lg text-[8px] font-bold shadow-2xl whitespace-nowrap max-w-[80px] truncate border border-white/10 z-20"
                onClick={() => setSelectedNoteUser(user)}
              >
                {user.note.text}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-800/90 rotate-45" />
              </motion.div>
            )}
            {/* Reaction Summary */}
            {user.note?.reactions && Object.keys(user.note.reactions).length > 0 && (
              <div className="absolute -bottom-1 -right-1 flex -space-x-1">
                {Array.from(new Set(Object.values(user.note.reactions))).slice(0, 2).map((emoji, i) => (
                  <span key={i} className="text-[8px] bg-slate-800 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white/10 shadow-lg">
                    {emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider truncate max-w-[48px]">{user.displayName.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  );
}
