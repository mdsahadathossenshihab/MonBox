import React, { useState } from 'react';
import { useChat } from '../ChatProvider';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Smile, MessageCircle, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

export default function GlobalModals() {
  const { 
    currentUser, usersWithNotes, isAddingNote, setIsAddingNote, 
    selectedNoteUser, setSelectedNoteUser, setNote, deleteNote,
    sendDirectMessage, addNoteReaction
  } = useChat();

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

  const handleComment = async () => {
    if (commentText.trim() && selectedNoteUser) {
      await sendDirectMessage(selectedNoteUser.uid, `Replying to your note "${selectedNoteUser.note?.text}": ${commentText.trim()}`, 'text', undefined, {
        id: 'note-reply',
        text: selectedNoteUser.note?.text || '',
        senderName: selectedNoteUser.displayName
      });
      setCommentText('');
      setSelectedNoteUser(null);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (selectedNoteUser) {
      await addNoteReaction(selectedNoteUser.uid, emoji);
      setShowReactions(false);
    }
  };

  return (
    <>
      {/* Add Note Modal */}
      <AnimatePresence>
        {isAddingNote && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setIsAddingNote(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
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
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-monbox-teal/30 resize-none h-32"
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-500">
                    {noteText.length}/60
                  </span>
                </div>
                
                <button 
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-monbox-teal text-white font-bold py-4 rounded-2xl shadow-2xl hover:bg-monbox-teal/80 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Send className="w-5 h-5" />
                  Share Note
                </button>
                
                <p className="text-[10px] text-center text-slate-500 font-medium">
                  Notes are visible for 24 hours.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note Detail / Comment Modal */}
      <AnimatePresence>
        {selectedNoteUser && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => { setSelectedNoteUser(null); setShowReactions(false); }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedNoteUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedNoteUser.uid}`} 
                      className="w-10 h-10 rounded-xl border border-white/10"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedNoteUser.displayName}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        {selectedNoteUser.note?.timestamp ? formatDistanceToNow(selectedNoteUser.note.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedNoteUser.uid === currentUser?.uid && (
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => setSelectedNoteUser(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 relative group">
                  <p className="text-lg font-medium text-white leading-relaxed">
                    {selectedNoteUser.note?.text}
                  </p>
                  
                  {/* Reactions List */}
                  {selectedNoteUser.note?.reactions && Object.keys(selectedNoteUser.note.reactions).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(selectedNoteUser.note.reactions).map(([uid, emoji]) => {
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

                {selectedNoteUser.uid !== currentUser?.uid && (
                  <>
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
                                onClick={() => handleReaction(emoji)}
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
                            selectedNoteUser.note?.reactions?.[currentUser?.uid || ''] 
                              ? "bg-monbox-teal text-white" 
                              : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <Smile className="w-4 h-4" /> 
                          {selectedNoteUser.note?.reactions?.[currentUser?.uid || ''] || 'React'}
                        </button>
                        <button 
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-monbox-teal/10 text-monbox-teal hover:bg-monbox-teal hover:text-white rounded-2xl font-bold text-xs transition-all"
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
                        onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                        placeholder="Send a reply..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:ring-2 focus:ring-monbox-teal/30 transition-all"
                      />
                      <button 
                        onClick={handleComment}
                        disabled={!commentText.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-monbox-teal text-white rounded-xl disabled:opacity-50 transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Note Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Delete Note?</h3>
              <p className="text-sm text-slate-500 text-center mb-8">Are you sure you want to delete your current note?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                <button 
                  onClick={async () => {
                    await deleteNote();
                    setShowDeleteConfirm(false);
                    setSelectedNoteUser(null);
                  }}
                  className="flex-1 py-4 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
