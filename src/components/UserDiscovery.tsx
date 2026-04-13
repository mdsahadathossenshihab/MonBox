import React, { useState } from 'react';
import { useChat } from '../ChatProvider';
import { Search, UserPlus, MessageSquare, X, ArrowLeft, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

export default function UserDiscovery({ onClose }: { onClose: () => void }) {
  const { allUsers, currentUser, startChat } = useChat();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = allUsers.filter(user => 
    user.uid !== currentUser?.uid && 
    (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex-1 flex flex-col bg-[#020617] h-screen relative overflow-hidden"
    >
      {/* Background Atmospheric Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-monbox-teal/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <div className="h-24 bg-slate-900/40 backdrop-blur-3xl border-b border-white/5 px-10 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="p-3.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tighter font-display">Discover Network</h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Connect with secure identities</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-monbox-teal/10 border border-monbox-teal/20 rounded-2xl teal-glow">
          <Sparkles className="w-4 h-4 text-monbox-teal animate-pulse" />
          <span className="text-[9px] font-black text-monbox-teal uppercase tracking-[0.3em]">Verified Community</span>
        </div>
      </div>

      {/* Search Section */}
      <div className="p-10 pb-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 group-focus-within:text-monbox-teal transition-colors" />
            <input 
              type="text"
              placeholder="Search by name, email or secure ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] py-6 pl-20 pr-8 text-white placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-monbox-teal/10 focus:border-monbox-teal/50 transition-all shadow-2xl teal-glow"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pt-4 relative z-0">
        <div className="max-w-5xl mx-auto">
          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredUsers.map((user, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={user.uid}
                  className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 shadow-2xl hover:border-monbox-teal/40 transition-all group relative overflow-hidden teal-glow"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-monbox-teal/5 rounded-bl-[5rem] -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <img 
                        src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                        alt={user.displayName} 
                        className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white/10 shadow-2xl group-hover:scale-105 transition-transform"
                      />
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-4 border-slate-950 rounded-full" />
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-monbox-teal transition-colors">{user.displayName}</h3>
                    <p className="text-xs text-slate-500 font-medium mb-6 truncate w-full px-6">{user.bio || 'Secure MonBox Identity'}</p>
                    
                    <button
                      onClick={() => {
                        startChat(user);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-monbox-teal text-slate-300 hover:text-white font-bold rounded-2xl transition-all active:scale-95 border border-white/5 hover:border-monbox-teal shadow-xl"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Establish Link
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-32 h-32 rounded-[4rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 teal-glow">
                <Users className="w-12 h-12 text-slate-800" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No identities found</h3>
              <p className="text-slate-600 max-w-xs mx-auto text-sm">Try refining your search parameters or check for spelling errors.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
