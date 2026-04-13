import React, { useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useChat } from '../ChatProvider';
import { X } from 'lucide-react';

interface CallAreaProps {
  isOpen: boolean;
  chatId: string;
  onClose: () => void;
  isGroup?: boolean;
}

export const CallArea: React.FC<CallAreaProps> = ({ isOpen, chatId, onClose, isGroup }) => {
  const { currentUser } = useChat();
  const containerRef = useRef<HTMLDivElement>(null);

  const [deviceError, setDeviceError] = React.useState<string | null>(null);
  const zpRef = useRef<any>(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (!isOpen || !currentUser || !containerRef.current || isInitializing.current) return;

    const appID = Number(import.meta.env.VITE_ZEGOCLOUD_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGOCLOUD_SERVER_SECRET;

    if (!appID || !serverSecret) {
      setDeviceError('ZegoCloud configuration is missing. Please add AppID and ServerSecret in Settings > Secrets.');
      return;
    }

    const myMeeting = async () => {
      isInitializing.current = true;
      setDeviceError(null);
      
      // Check for available devices to avoid NotFoundError
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

      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: isGroup ? ZegoUIKitPrebuilt.GroupCall : ZegoUIKitPrebuilt.OneONoneCall,
        },
        showScreenSharingButton: false, 
        showMyCameraToggleButton: hasCamera,
        showMyMicrophoneToggleButton: hasMic,
        showAudioVideoSettingsButton: true,
        showUserList: false, // Hide user list to feel less like a meeting
        showLayoutButton: false, // Hide layout button
        showNonVideoUser: true,
        showTextChat: false, // Hide chat inside call
        showPreJoinView: false, // Skip the "Join Room" preview screen
        turnOnCameraWhenJoining: hasCamera,
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
  }, [chatId, currentUser, isGroup, onClose, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-slate-900">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-white">Call in Progress</h2>
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
      <div ref={containerRef} className="flex-1 w-full h-full" />
    </div>
  );
};
