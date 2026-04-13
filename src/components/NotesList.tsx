import React, { useState } from 'react';
import { useChat } from '../ChatProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Send, Heart, MessageCircle, Clock, Smile, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { User } from '../types';
import { cn } from '../lib/utils';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

export default function NotesList() {
  const { currentUser, usersWithNotes, setNote, deleteNote, sendDirectMessage, addNoteReaction } = useChat();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [noteText, setNoteText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddNote = async () => {
    if (noteText.trim()) {
      await setNote(noteText.trim());
      setNoteText('');
      setIsAddingNote(false);
    }
  };

  const handleComment = async (user: User) => {
    if (commentText.trim()) {
      await sendDirectMessage(user.uid, `Replying to your note "${user.note?.text}": ${commentText.trim()}`, 'text', undefined, {
        id: 'note-reply',
        text: user.note?.text || '',
        senderName: user.displayName
      });
      setCommentText('');
      setSelectedUser(null);
    }
  };

  const handleReaction = async (user: User, emoji: string) => {
    await addNoteReaction(user.uid, emoji);
    setShowReactions(false);
  };

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
                setShowDeleteConfirm(true);
              }}
            >
              {currentUser.note.text}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rotate-45" />
            </motion.div>
          )}
        </div>
        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">You</span>
      </div>

      {/* Delete Note Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Delete Note?</h3>
              <p className="text-sm text-slate-500 text-center mb-8">Are you sure you want to delete your current note?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                <button 
                  onClick={() => {
                    deleteNote();
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Other Users' Notes */}
      {usersWithNotes.filter(u => u.uid !== currentUser?.uid).map(user => (
        <div key={user.uid} className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-2xl border border-monbox-teal/30 p-0.5 cursor-pointer hover:border-monbox-teal transition-all"
              onClick={() => setSelectedUser(user)}
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
                onClick={() => setSelectedUser(user)}
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

      {/* Note Detail / Comment Modal */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200]"
              onClick={() => { setSelectedUser(null); setShowReactions(false); }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden z-[201] shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.uid}`} 
                      className="w-10 h-10 rounded-xl border border-white/10"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedUser.displayName}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        {selectedUser.note?.timestamp ? formatDistanceToNow(selectedUser.note.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 relative group">
                  <p className="text-lg font-medium text-white leading-relaxed">
                    {selectedUser.note?.text}
                  </p>
                  
                  {/* Reactions List */}
                  {selectedUser.note?.reactions && Object.keys(selectedUser.note.reactions).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(selectedUser.note.reactions).map(([uid, emoji]) => {
                        const reactor = usersWithNotes.find(u => u.uid === uid) || { displayName: 'Someone' };
                        return (
                          <div key={uid} className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full border border-white/5" title={reactor.displayName}>
                            <span className="text-xs">{emoji}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <AnimatePresence>
                    {showReactions && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-white/10 rounded-full p-1.5 flex gap-1 shadow-2xl z-10"
                      >
                        {REACTION_EMOJIS.map(emoji => (
                          <button 
                            key={emoji}
                            onClick={() => handleReaction(selectedUser, emoji)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowReactions(!showReactions)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs transition-all",
                        selectedUser.note?.reactions?.[currentUser?.uid || ''] 
                          ? "bg-blue-500 text-white" 
                          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Smile className="w-4 h-4" /> 
                      {selectedUser.note?.reactions?.[currentUser?.uid || ''] || 'React'}
                    </button>
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-2xl font-bold text-xs transition-all"
                      onClick={() => document.getElementById('comment-input')?.focus()}
                    >
                      <MessageCircle className="w-4 h-4" /> Reply
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input 
                    id="comment-input"
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment(selectedUser)}
                    placeholder="Send a reply..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                  <button 
                    onClick={() => handleComment(selectedUser)}
                    disabled={!commentText.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Note Modal */}
      <AnimatePresence>
        {isAddingNote && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200]"
              onClick={() => setIsAddingNote(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 z-[201] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold text-white">Share a Note</h3>
                <button 
                  onClick={() => setIsAddingNote(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="relative">
                  <textarea 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value.slice(0, 60))}
                    placeholder="What's on your mind?"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none h-32"
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-500">
                    {noteText.length}/60
                  </span>
                </div>
                
                <button 
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-white text-slate-950 font-bold py-4 rounded-2xl shadow-2xl hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Send className="w-5 h-5" />
                  Share Note
                </button>
                
                <p className="text-[10px] text-center text-slate-500 font-medium">
                  Notes are visible for 24 hours.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
