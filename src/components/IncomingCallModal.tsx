import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Video, X, Check } from 'lucide-react';
import { useChat } from '../ChatProvider';

export default function IncomingCallModal() {
  const { incomingCall, acceptCall, rejectCall } = useChat();

  if (!incomingCall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 z-[200] w-80 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl teal-glow overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-monbox-teal animate-[pulse_2s_infinite]" />
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-monbox-teal/30 p-1">
              <img 
                src={incomingCall.callerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.callerId}`} 
                alt={incomingCall.callerName}
                className="w-full h-full object-cover rounded-[1.7rem]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-monbox-teal rounded-full flex items-center justify-center border-4 border-slate-900">
              {incomingCall.type === 'video' ? (
                <Video className="w-3.5 h-3.5 text-white" />
              ) : (
                <Phone className="w-3.5 h-3.5 text-white" />
              )}
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mb-1">{incomingCall.callerName}</h3>
          <p className="text-[10px] font-black text-monbox-teal uppercase tracking-widest mb-6 animate-pulse">
            Incoming {incomingCall.type} Call...
          </p>

          <div className="flex items-center gap-4 w-full">
            <button
              onClick={rejectCall}
              className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all flex items-center justify-center gap-2 group"
            >
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <X className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Decline</span>
            </button>
            <button
              onClick={acceptCall}
              className="flex-1 py-3 bg-monbox-teal/10 hover:bg-monbox-teal/20 text-monbox-teal rounded-2xl transition-all flex items-center justify-center gap-2 group"
            >
              <div className="w-8 h-8 bg-monbox-teal rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Accept</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
