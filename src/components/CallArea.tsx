import React, { useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useChat } from '../ChatProvider';
import { X, Phone, Video } from 'lucide-react';
import { motion } from 'motion/react';

interface CallAreaProps {
  isOpen: boolean;
  chatId: string;
  onClose: () => void;
  isGroup?: boolean;
  callType: 'audio' | 'video';
}

export const CallArea: React.FC<CallAreaProps> = ({ isOpen, chatId, onClose, isGroup, callType }) => {
  const { currentUser, activeCall, allUsers } = useChat();
  const containerRef = useRef<HTMLDivElement>(null);

  const [deviceError, setDeviceError] = React.useState<string | null>(null);
  const zpRef = useRef<any>(null);
  const isInitializing = useRef(false);

  // Find receiver info for the calling screen
  const receiver = allUsers.find(u => u.uid === activeCall?.receiverId);

  useEffect(() => {
    // Only join room if call is accepted
    if (!isOpen || !currentUser || !containerRef.current || isInitializing.current || activeCall?.status !== 'accepted') return;

    const appID = Number(import.meta.env.VITE_ZEGOCLOUD_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGOCLOUD_SERVER_SECRET;

    if (!appID || !serverSecret) {
      setDeviceError('ZegoCloud configuration is missing. Please add AppID and ServerSecret in Settings > Secrets.');
      return;
    }

    const myMeeting = async () => {
      isInitializing.current = true;
      setDeviceError(null);
      
      let hasCamera = false;
      let hasMic = false;
      
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        hasCamera = devices.some(device => device.kind === 'videoinput');
        hasMic = devices.some(device => device.kind === 'audioinput');
        
        if (!hasCamera && !hasMic) {
          setDeviceError('No camera or microphone found. Please connect your hardware and try again.');
        }
      } catch (e) {
        console.warn('Could not enumerate devices:', e);
      }

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        chatId,
        currentUser.uid,
        currentUser.displayName || 'User'
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      const isVideoCall = callType === 'video';

      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: isGroup ? ZegoUIKitPrebuilt.GroupCall : ZegoUIKitPrebuilt.OneONoneCall,
        },
        showScreenSharingButton: false, 
        showMyCameraToggleButton: isVideoCall && hasCamera,
        showMyMicrophoneToggleButton: hasMic,
        showAudioVideoSettingsButton: true,
        showUserList: false,
        showLayoutButton: false,
        showNonVideoUser: true,
        showTextChat: false,
        showPreJoinView: false,
        turnOnCameraWhenJoining: isVideoCall && hasCamera,
        turnOnMicrophoneWhenJoining: hasMic,
        onLeaveRoom: () => {
          onClose();
        }
      });
    };

    myMeeting();

    return () => {
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying Zego instance:', e);
        }
        zpRef.current = null;
      }
      isInitializing.current = false;
    };
  }, [chatId, currentUser, isGroup, onClose, isOpen, callType, activeCall?.status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-slate-900">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-white">
            {activeCall?.status === 'ringing' ? 'Calling...' : 'Call in Progress'}
          </h2>
          {deviceError && (
            <p className="text-xs text-rose-500 font-medium animate-pulse">{deviceError}</p>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 w-full h-full relative">
        {activeCall?.status === 'ringing' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-8">
                <div className="w-32 h-32 rounded-[3rem] overflow-hidden border-4 border-monbox-teal/20 p-1.5 relative z-10">
                  <img 
                    src={receiver?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCall?.receiverId}`} 
                    alt={receiver?.displayName}
                    className="w-full h-full object-cover rounded-[2.5rem]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute inset-0 bg-monbox-teal/20 blur-3xl rounded-full animate-pulse" />
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-monbox-teal rounded-2xl flex items-center justify-center border-4 border-slate-950 z-20">
                  {callType === 'video' ? (
                    <Video className="w-6 h-6 text-white" />
                  ) : (
                    <Phone className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{receiver?.displayName || 'User'}</h3>
              <p className="text-sm font-medium text-monbox-teal animate-pulse tracking-widest uppercase">
                Ringing...
              </p>

              <div className="mt-12 flex gap-8">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-bounce">
                  <Phone className="w-6 h-6 text-monbox-teal" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
