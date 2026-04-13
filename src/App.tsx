import React from 'react';
import { ChatProvider, useChat } from './ChatProvider';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Auth from './components/Auth';
import SettingsPage from './components/SettingsPage';
import FeedbackBoard from './components/FeedbackBoard';
import UserDiscovery from './components/UserDiscovery';
import IncomingCallModal from './components/IncomingCallModal';
import GlobalModals from './components/GlobalModals';
import { CallArea } from './components/CallArea';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { MessageSquare, Shield, Sparkles } from 'lucide-react';

function AppContent() {
  const { currentUser, loading, activeChat, activeCall, incomingCall, endCall } = useChat();
  const [view, setView] = React.useState<'chat' | 'settings' | 'feedback' | 'discover'>('chat');
  const ringtoneRef = React.useRef<HTMLAudioElement | null>(null);
  const callingRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (incomingCall) {
      ringtoneRef.current?.play().catch(() => {});
    } else {
      ringtoneRef.current?.pause();
      if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
    }
  }, [incomingCall]);

  React.useEffect(() => {
    if (activeCall?.status === 'ringing') {
      callingRef.current?.play().catch(() => {});
    } else {
      callingRef.current?.pause();
      if (callingRef.current) callingRef.current.currentTime = 0;
    }
  }, [activeCall?.status]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-monbox-teal/10 blur-[150px] rounded-full animate-pulse" />
        </div>
        <div className="relative mb-10">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="w-32 h-32 border-4 border-white/5 border-t-monbox-teal rounded-[3rem] shadow-2xl teal-glow"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-monbox-teal" />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative z-10"
        >
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tighter font-display">MonBox</h2>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-monbox-teal animate-pulse" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Establishing Secure Link</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="h-screen w-full bg-[#020617] flex overflow-hidden relative font-sans">
      <AnimatePresence mode="wait">
        {view === 'settings' ? (
          <motion.div 
            key="settings"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 350 }}
            className="absolute inset-0 z-[100]"
          >
            <SettingsPage onBack={() => setView('chat')} />
          </motion.div>
        ) : view === 'feedback' ? (
          <motion.div 
            key="feedback"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 350 }}
            className="absolute inset-0 z-[100]"
          >
            <FeedbackBoard onBack={() => setView('chat')} />
          </motion.div>
        ) : view === 'discover' ? (
          <motion.div 
            key="discover"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 350 }}
            className="absolute inset-0 z-[100]"
          >
            <UserDiscovery onClose={() => setView('chat')} />
          </motion.div>
        ) : (
          <motion.div 
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex overflow-hidden relative z-10 bg-[#020617]"
          >
            <Sidebar 
              className={cn(
                "w-full md:w-80 lg:w-96",
                activeChat ? "hidden md:flex" : "flex"
              )}
              onOpenSettings={() => setView('settings')}
              onOpenFeedback={() => setView('feedback')}
              onOpenDiscover={() => setView('discover')}
            />
            
            <div className="flex-1 flex flex-col min-w-0 relative">
              <AnimatePresence mode="wait">
                {activeChat ? (
                  <motion.div 
                    key={activeChat.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="flex-1 h-full"
                  >
                    <ChatArea />
                  </motion.div>
                ) : (
                  <div className="hidden md:flex flex-1 h-full">
                    <ChatArea />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <IncomingCallModal />
      <GlobalModals />
      
      {activeCall && (
        <CallArea 
          isOpen={true}
          chatId={activeCall.chatId}
          onClose={endCall}
          callType={activeCall.type}
          isGroup={false} // Signaling currently supports 1-to-1
        />
      )}

      <audio 
        ref={ringtoneRef}
        src="https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"
        loop
        className="hidden"
      />
      <audio 
        ref={callingRef}
        src="https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3"
        loop
        className="hidden"
      />
    </div>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
