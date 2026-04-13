import React, { useState, useEffect } from 'react';
import { useChat } from '../ChatProvider';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { MessageSquare, Send, Trash2, ArrowLeft, User as UserIcon, Lightbulb, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  timestamp: any;
}

export default function FeedbackBoard({ onBack }: { onBack: () => void }) {
  const { currentUser } = useChat();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
      setFeedbackList(list);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userPhoto: currentUser.photoURL || '',
        text: inputText.trim(),
        timestamp: serverTimestamp()
      });
      setInputText('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'feedback', deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      setError('Failed to delete feedback.');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="flex-1 h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-slate-900/50 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-white">Feedback & Suggestions</h1>
          <p className="text-xs text-slate-500">Help us improve SkyChat with your ideas</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Input Section */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Share your idea</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="What feature should we add next? Or what can we improve?"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[120px] resize-none"
              />
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting || !inputText.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Posting...' : 'Post Suggestion'}
                </button>
              </div>
            </form>
          </section>

          {/* Feedback List */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Community Suggestions</h3>
            <AnimatePresence mode="popLayout">
              {feedbackList.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 group relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.userId}`} 
                        className="w-10 h-10 rounded-xl border border-white/10"
                        alt={item.userName}
                      />
                      <div>
                        <p className="text-sm font-bold text-white">{item.userName}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.timestamp ? formatDistanceToNow(item.timestamp.toDate()) : 'Just now'} ago
                        </p>
                      </div>
                    </div>
                    {item.userId === currentUser?.uid && (
                      <button 
                        onClick={() => setDeleteId(item.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.text}
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <MessageCircle className="w-3.5 h-3.5" />
                      Discussion
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {feedbackList.length === 0 && (
              <div className="p-12 text-center text-slate-500 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p>No suggestions yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
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
              <h3 className="text-xl font-bold text-white text-center mb-2">Delete Suggestion?</h3>
              <p className="text-sm text-slate-500 text-center mb-8">Are you sure you want to delete this suggestion? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500 text-white font-bold rounded-2xl shadow-2xl z-[300]"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
