import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  User as FirebaseUser,
  updateProfile as updateFirebaseProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getToken, onMessage } from 'firebase/messaging';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  limit,
  arrayUnion,
  arrayRemove,
  deleteField
} from 'firebase/firestore';
import { auth, db, googleProvider, messaging } from './lib/firebase';
import { User, Chat, Message, OperationType, FirestoreErrorInfo, Call } from './types';
import { resizeImage } from './lib/imageUtils';

interface ChatContextType {
  currentUser: User | null;
  loading: boolean;
  chats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => void;
  messages: Message[];
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, gender: 'male' | 'female' | 'other') => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  sendMessage: (text: string, type?: 'text' | 'image' | 'voice', fileUrl?: string, replyTo?: Message['replyTo']) => Promise<void>;
  sendDirectMessage: (recipientId: string, text: string, type?: 'text' | 'image' | 'voice', fileUrl?: string, replyTo?: Message['replyTo']) => Promise<void>;
  users: User[];
  allUsers: User[];
  searchUsers: (query: string) => Promise<User[]>;
  startChat: (user: User) => Promise<void>;
  createGroupChat: (name: string, participants: string[], duration?: number) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  addNoteReaction: (userId: string, emoji: string) => Promise<void>;
  deleteMessage: (messageId: string, mode?: 'me' | 'everyone') => Promise<void>;
  setTyping: (isTyping: boolean) => Promise<void>;
  updateUserProfile: (data: { displayName?: string, photoURL?: string, bio?: string, gender?: string, dob?: string, address?: string }) => Promise<void>;
  updateEmailAddress: (newEmail: string) => Promise<void>;
  uploadFile: (file: File | Blob, path: string) => Promise<string>;
  clearChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  toggleArchive: (chatId: string) => Promise<void>;
  toggleMute: (chatId: string) => Promise<void>;
  toggleBlock: (chatId: string) => Promise<void>;
  toggleRestrict: (chatId: string) => Promise<void>;
  markAsUnread: (chatId: string) => Promise<void>;
  setNote: (text: string) => Promise<void>;
  deleteNote: () => Promise<void>;
  typingUser: string | null;
  usersWithNotes: User[];
  updateChatSettings: (chatId: string, settings: Partial<Chat>) => Promise<void>;
  setNickname: (chatId: string, userId: string, nickname: string) => Promise<void>;
  reportChat: (chatId: string, reason: string) => Promise<void>;
  updateGroupMember: (chatId: string, userId: string, action: 'add' | 'remove' | 'make_admin' | 'make_moderator' | 'remove_admin' | 'remove_moderator') => Promise<void>;
  activeCall: Call | null;
  incomingCall: Call | null;
  initiateCall: (chatId: string, receiverId: string, type: 'audio' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [usersWithNotes, setUsersWithNotes] = useState<User[]>([]);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  // Handle FCM Token
  useEffect(() => {
    const setupMessaging = async () => {
      if (!currentUser || !messaging) return;
      
      try {
        // 1. Handle Android Bridge Token
        // @ts-ignore
        const androidToken = window.AndroidInterface?.getFcmToken?.();
        
        // 2. Handle Web Token
        let webToken = null;
        if (!androidToken) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            webToken = await getToken(messaging, {
              vapidKey: 'YOUR_VAPID_KEY_IF_NEEDED' // Usually not needed if configured in firebase-applet-config.json
            });
          }
        }

        const finalToken = androidToken || webToken;
        
        if (finalToken && finalToken !== currentUser.fcmToken) {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            fcmToken: finalToken
          });
          setCurrentUser(prev => prev ? { ...prev, fcmToken: finalToken } : null);
        }

        // 3. Listen for foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          if (payload.notification) {
            // You could show a custom toast here if you want
            // For now, we'll just let the browser show it if possible
            new Notification(payload.notification.title || 'New Message', {
              body: payload.notification.body,
              icon: '/logo.png'
            });
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up messaging:', error);
      }
    };

    if (currentUser) {
      const unsubPromise = setupMessaging();
      return () => {
        unsubPromise.then(unsub => unsub && unsub());
      };
    }
  }, [currentUser]);

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (user && user.emailVerified) {
        if (sessionStorage.getItem('isDeletingAccount') === 'true') {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        unsubDoc = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setCurrentUser(snap.data() as User);
          } else {
            setCurrentUser(null);
          }
          setLoading(false);
        }, (err) => {
          console.error('User doc listener error:', err);
          setLoading(false);
        });

        try {
          await updateDoc(userRef, {
            isOnline: true,
            lastSeen: serverTimestamp()
          });
        } catch (error) {
          console.error('Error updating online status:', error);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  // Handle online status
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    
    const handleVisibilityChange = async () => {
      try {
        if (document.visibilityState === 'hidden') {
          await updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() });
        } else {
          await updateDoc(userRef, { isOnline: true, lastSeen: serverTimestamp() });
        }
      } catch (e) {
        // Silent fail for background updates to avoid annoying users
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set online initially
    updateDoc(userRef, { isOnline: true, lastSeen: serverTimestamp() }).catch(() => {});

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() }).catch(() => {});
    };
  }, [currentUser?.uid]);

  // Listen to chats
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Timestamp.now();
      const chatList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Chat))
        .filter(chat => {
          // Filter out deleted chats
          if (chat.deletedBy?.includes(currentUser.uid)) return false;
          
          // Filter out expired group chats
          if (chat.isGroup && chat.expiresAt) {
            if (chat.expiresAt.toMillis() < now.toMillis()) {
              // Optionally delete it from Firestore if I'm the creator or just hide it
              return false;
            }
          }
          return true;
        });
      setChats(chatList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Keep activeChat in sync with chats list
  useEffect(() => {
    if (activeChat && chats.length > 0) {
      const updatedActiveChat = chats.find(c => c.id === activeChat.id);
      if (updatedActiveChat && JSON.stringify(updatedActiveChat) !== JSON.stringify(activeChat)) {
        setActiveChat(updatedActiveChat);
      }
    }
  }, [chats, activeChat?.id]);

  // Keep activeChat in sync with chats list
  useEffect(() => {
    if (activeChat) {
      const updatedChat = chats.find(c => c.id === activeChat.id);
      if (updatedChat) {
        // Only update if something meaningful changed to avoid loops
        if (updatedChat.updatedAt?.toMillis() !== activeChat.updatedAt?.toMillis() || 
            JSON.stringify(updatedChat.unreadCount) !== JSON.stringify(activeChat.unreadCount)) {
          setActiveChat(updatedChat);
        }
      }
    }
  }, [chats]);

  // Listen to messages
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Timestamp.now();
      const msgList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Message))
        .filter(msg => {
          // Hide deleted messages
          if (msg.deletedFor?.includes(currentUser?.uid || '')) return false;
          // Hide scheduled messages until they are due
          if (msg.scheduledFor && msg.scheduledFor.toMillis() > now.toMillis() && msg.senderId !== currentUser?.uid) return false;
          return true;
        });
      
      setMessages(msgList);
      
      // Mark messages as seen
      const isRestricted = activeChat.restrictedBy?.includes(currentUser?.uid || '');
      const isVisible = document.visibilityState === 'visible';
      
      if (msgList.length > 0 && activeChat.unreadCount?.[currentUser?.uid || ''] && !isRestricted && isVisible) {
        updateDoc(doc(db, 'chats', activeChat.id), {
          [`unreadCount.${currentUser?.uid}`]: 0,
          [`lastRead.${currentUser?.uid}`]: serverTimestamp()
        }).catch(() => {});
      }

      msgList.forEach(async (msg) => {
        if (msg.senderId !== currentUser?.uid && !isRestricted) {
          const alreadySeen = msg.seenBy?.includes(currentUser?.uid || '');
          if (!alreadySeen) {
            try {
              await updateDoc(doc(db, 'chats', activeChat.id, 'messages', msg.id), {
                status: 'seen',
                seenBy: arrayUnion(currentUser?.uid)
              });
            } catch (e) {}
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${activeChat.id}/messages`);
    });

    return () => unsubscribe();
  }, [activeChat, currentUser]);

  // Update message status to 'delivered' when recipient comes online
  useEffect(() => {
    if (!currentUser || !activeChat) return;
    
    const otherUserId = activeChat.participants.find(id => id !== currentUser.uid);
    const otherUser = users.find(u => u.uid === otherUserId);
    
    if (otherUser?.isOnline) {
      const undeliveredMessages = messages.filter(m => m.senderId === currentUser.uid && m.status === 'sent');
      undeliveredMessages.forEach(async (msg) => {
        try {
          await updateDoc(doc(db, 'chats', activeChat.id, 'messages', msg.id), {
            status: 'delivered'
          });
        } catch (e) {}
      });
    }
  }, [users, activeChat?.id, currentUser?.uid, messages.length]);

  // Listen to all users for discovery
  useEffect(() => {
    if (!currentUser) {
      setAllUsers([]);
      return;
    }

    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs
        .map(doc => doc.data() as User)
        .filter(u => u.uid !== currentUser.uid);
      setAllUsers(userList);
      setUsers(userList); // Also update the main users list used for online status checks
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Cleanup expired ephemeral groups
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!currentUser) return;
      const now = Timestamp.now();
      // Only the creator should clean up to avoid permission issues and race conditions
      const expiredChats = chats.filter(c => 
        c.isGroup && 
        c.expiresAt && 
        c.expiresAt.toMillis() < now.toMillis() &&
        c.createdBy === currentUser.uid
      );
      
      for (const chat of expiredChats) {
        try {
          // Delete messages first
          const messagesRef = collection(db, 'chats', chat.id, 'messages');
          const messagesSnap = await getDocs(messagesRef);
          const msgDeletions = messagesSnap.docs.map(m => deleteDoc(m.ref));
          await Promise.all(msgDeletions);
          // Delete chat
          await deleteDoc(doc(db, 'chats', chat.id));
        } catch (e) {
          console.error('Error cleaning up expired chat:', chat.id, e);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [chats, currentUser]);

  useEffect(() => {
    if (!currentUser || chats.length === 0) {
      setUsersWithNotes([]);
      return;
    }

    const participantIds = Array.from(new Set(chats.flatMap(c => c.participants))).filter(id => id !== currentUser.uid);
    if (participantIds.length === 0) {
      setUsersWithNotes([]);
      return;
    }

    // Firestore 'in' query limit is 10, but we can just listen to all users in chats if needed
    // For simplicity, let's listen to users who have a note field that is not null
    const q = query(
      collection(db, 'users'),
      where('note', '!=', null)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Timestamp.now();
      const usersWithActiveNotes = snapshot.docs
        .map(doc => doc.data() as User)
        .filter(u => {
          if (!u.note) return false;
          // Check if note is expired
          return u.note.expiresAt.toMillis() > now.toMillis();
        });
      
      // Filter to only show notes from people you have chats with (or everyone for a more social feel)
      setUsersWithNotes(usersWithActiveNotes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users_notes');
    });

    return () => unsubscribe();
  }, [currentUser, chats.length]);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUserDoc = {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          email: user.email || '',
          isOnline: true,
          lastSeen: serverTimestamp() as Timestamp
        };
        await setDoc(userRef, newUserDoc);
        setCurrentUser(newUserDoc as User);
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, gender: 'male' | 'female' | 'other') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      
      // Custom avatars based on the provided image style (Flat design, purple theme)
      let photoURL = "";
      
      if (gender === 'male') {
        // Male Avatar SVG (Purple theme, shirt and tie)
        photoURL = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%236b4e8d'/><path d='M50 25c-8 0-15 6-15 15v5c0 8 7 15 15 15s15-7 15-15v-5c0-9-7-15-15-15z' fill='%23f3d1b5'/><path d='M35 40c0-8 7-15 15-15s15 7 15 15v5h-30v-5z' fill='%232c3e50'/><path d='M20 85c0-15 15-20 30-20s30 5 30 20v15H20V85z' fill='%238e44ad'/><path d='M50 65l-5 10h10l-5-10z' fill='%23f3d1b5'/><path d='M45 75l5 25 5-25h-10z' fill='%232c3e50'/></svg>`;
      } else if (gender === 'female') {
        // Female Avatar SVG (Purple theme, bun hair)
        photoURL = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%236b4e8d'/><path d='M50 30c-8 0-15 6-15 15v5c0 8 7 15 15 15s15-7 15-15v-5c0-9-7-15-15-15z' fill='%23f3d1b5'/><path d='M50 15c-5 0-10 4-10 10s5 10 10 10 10-4 10-10-5-10-10-10z' fill='%232c3e50'/><path d='M35 45c0-8 7-15 15-15s15 7 15 15v5c0 5-2 10-5 12l-10 3-10-3c-3-2-5-7-5-12v-5z' fill='%232c3e50'/><path d='M20 90c0-15 15-20 30-20s30 5 30 20v10H20V90z' fill='%238e44ad'/><path d='M50 70l-3 10h6l-3-10z' fill='%23f3d1b5'/></svg>`;
      } else {
        photoURL = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userCredential.user.uid}`;
      }

      await updateFirebaseProfile(userCredential.user, { 
        displayName: name,
        photoURL: photoURL
      });
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      // Initial user doc creation
      const userDoc = {
        uid: userCredential.user.uid,
        displayName: name,
        photoURL: photoURL,
        email: email,
        gender: gender,
        isOnline: true,
        lastSeen: serverTimestamp() as Timestamp
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      
      // Sign out immediately so they must verify and log in
      await signOut(auth);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data: { displayName?: string, photoURL?: string, bio?: string, gender?: string, dob?: string, address?: string }) => {
    if (!auth.currentUser || !currentUser) return;
    try {
      // Firebase Auth has a strict limit on photoURL length (~2048 chars).
      // Base64 strings are much longer, so we only update Firestore for those.
      const authUpdate: any = {};
      if (data.displayName) authUpdate.displayName = data.displayName;
      if (data.photoURL && data.photoURL.length < 2000) {
        authUpdate.photoURL = data.photoURL;
      }

      if (Object.keys(authUpdate).length > 0) {
        await updateFirebaseProfile(auth.currentUser, authUpdate);
      }

      // Firestore can handle up to 1MB per document, so Base64 is fine here.
      await updateDoc(doc(db, 'users', currentUser.uid), data);
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);

      // Update participantDetails in all chats
      if (data.displayName || data.photoURL) {
        const chatsQuery = query(collection(db, 'chats'), where('participants', 'array-contains', currentUser.uid));
        const chatsSnap = await getDocs(chatsQuery);
        const updateTasks = chatsSnap.docs.map(chatDoc => {
          const updates: any = {};
          if (data.displayName) updates[`participantDetails.${currentUser.uid}.displayName`] = data.displayName;
          if (data.photoURL) updates[`participantDetails.${currentUser.uid}.photoURL`] = data.photoURL;
          return updateDoc(chatDoc.ref, updates);
        });
        await Promise.all(updateTasks);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const updateEmailAddress = async (newEmail: string) => {
    if (!auth.currentUser) return;
    try {
      // In modern Firebase, verifyBeforeUpdateEmail is preferred
      // It sends a verification email to the new address. 
      // The email is only updated after verification.
      const { verifyBeforeUpdateEmail } = await import('firebase/auth');
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          isOnline: false,
          lastSeen: serverTimestamp(),
          typingTo: null
        });
      } catch (e) {}
    }
    await signOut(auth);
  };

  const sendMessage = async (text: string, type: 'text' | 'image' | 'voice' = 'text', fileUrl?: string, replyTo?: Message['replyTo'], scheduledFor?: string | null) => {
    if (!activeChat || !currentUser) {
      console.warn('sendMessage: Missing activeChat or currentUser', { activeChat, currentUser });
      return;
    }

    const otherUserId = activeChat.participants.find(id => id !== currentUser.uid);
    const otherUser = users.find(u => u.uid === otherUserId);
    
    // Check if blocked or restricted
    if (activeChat.blockedBy?.includes(currentUser.uid)) {
      throw new Error('You have blocked this user. Unblock to send messages.');
    }
    if (activeChat.blockedBy?.includes(otherUserId || '')) {
      throw new Error('You cannot send messages to this user.');
    }
    if (activeChat.restrictedBy?.includes(currentUser.uid)) {
      throw new Error('This chat is restricted. Unrestrict to send messages.');
    }

    try {
      const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
      const msgRef = doc(messagesRef);
      const messageId = msgRef.id;

      const messageData: any = {
        id: messageId,
        senderId: currentUser.uid,
        text,
        timestamp: serverTimestamp(),
        type,
        status: otherUser?.isOnline ? 'delivered' : 'sent',
        fileUrl: fileUrl || null,
        reactions: {},
        replyTo: replyTo || null
      };

      if (scheduledFor) {
        messageData.scheduledFor = Timestamp.fromDate(new Date(scheduledFor));
      }

      await setDoc(msgRef, messageData);
      
      const isOtherRestricted = activeChat.restrictedBy?.includes(otherUserId || '');
      const isOtherBlocked = activeChat.blockedBy?.includes(otherUserId || '');
      const isMeBlocked = activeChat.blockedBy?.includes(currentUser.uid);

      // Don't update chat metadata for scheduled messages until they are sent
      if (!scheduledFor) {
        const updateData: any = {
          lastMessage: {
            text: type === 'text' ? text : (type === 'image' ? '📷 Image' : '🎤 Voice message'),
            senderId: currentUser.uid,
            timestamp: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        };

        if (activeChat.isGroup) {
          activeChat.participants.forEach(pid => {
            if (pid !== currentUser.uid) {
              updateData[`unreadCount.${pid}`] = (activeChat.unreadCount?.[pid] || 0) + 1;
            }
          });
        } else if (otherUserId && !isOtherRestricted && !isOtherBlocked && !isMeBlocked) {
          updateData[`unreadCount.${otherUserId}`] = (activeChat.unreadCount?.[otherUserId!] || 0) + 1;
        }

        await updateDoc(doc(db, 'chats', activeChat.id), updateData);
      }
    } catch (error) {
      console.error('sendMessage: Error occurred', error);
      handleFirestoreError(error, OperationType.WRITE, `chats/${activeChat.id}/messages`);
    }
  };

  const sendDirectMessage = async (recipientId: string, text: string, type: 'text' | 'image' | 'voice' = 'text', fileUrl?: string, replyTo?: Message['replyTo']) => {
    if (!currentUser) return;

    try {
      const chatId = [currentUser.uid, recipientId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      let chatData: Chat;
      if (!chatDoc.exists()) {
        const recipientDoc = await getDoc(doc(db, 'users', recipientId));
        const recipientData = recipientDoc.data() as User;
        
        chatData = {
          id: chatId,
          participants: [currentUser.uid, recipientId],
          participantDetails: {
            [currentUser.uid]: {
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL
            },
            [recipientId]: {
              displayName: recipientData.displayName,
              photoURL: recipientData.photoURL
            }
          },
          updatedAt: serverTimestamp() as Timestamp,
          deletedBy: [],
          archivedBy: [],
          restrictedBy: []
        };
        await setDoc(chatRef, chatData);
      } else {
        chatData = { id: chatDoc.id, ...chatDoc.data() } as Chat;
      }

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const msgRef = doc(messagesRef);
      
      const messageData = {
        id: msgRef.id,
        senderId: currentUser.uid,
        text,
        timestamp: serverTimestamp(),
        type,
        status: 'sent',
        fileUrl: fileUrl || null,
        reactions: {},
        replyTo: replyTo || null
      };

      await setDoc(msgRef, messageData);

      const isOtherRestricted = chatData.restrictedBy?.includes(recipientId);
      const isOtherBlocked = chatData.blockedBy?.includes(recipientId);
      const isMeBlocked = chatData.blockedBy?.includes(currentUser.uid);

      const updateData: any = {
        lastMessage: {
          text: type === 'text' ? text : (type === 'image' ? '📷 Image' : '🎤 Voice message'),
          senderId: currentUser.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        deletedBy: arrayRemove(currentUser.uid),
        archivedBy: arrayRemove(currentUser.uid),
        restrictedBy: arrayRemove(currentUser.uid)
      };

      if (chatData.isGroup) {
        chatData.participants.forEach(pid => {
          if (pid !== currentUser.uid) {
            updateData[`unreadCount.${pid}`] = (chatData.unreadCount?.[pid] || 0) + 1;
          }
        });
      } else if (recipientId && !isOtherRestricted && !isOtherBlocked && !isMeBlocked) {
        updateData[`unreadCount.${recipientId}`] = (chatData.unreadCount?.[recipientId] || 0) + 1;
      }

      await updateDoc(chatRef, updateData);
      setActiveChat({ ...chatData, ...updateData });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sendDirectMessage');
    }
  };

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) return [];
    try {
      const q = query(
        collection(db, 'users'),
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => doc.data() as User)
        .filter(u => u.uid !== currentUser?.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  };

  const startChat = async (user: User) => {
    if (!currentUser) return;
    
    try {
      // Check if chat already exists
      const chatId = [currentUser.uid, user.uid].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        const newChat: Chat = {
          id: chatId,
          participants: [currentUser.uid, user.uid],
          participantDetails: {
            [currentUser.uid]: {
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL
            },
            [user.uid]: {
              displayName: user.displayName,
              photoURL: user.photoURL
            }
          },
          updatedAt: serverTimestamp() as Timestamp,
          deletedBy: [],
          archivedBy: [],
          restrictedBy: []
        };
        await setDoc(chatRef, newChat);
        setActiveChat(newChat);
      } else {
        const existingData = chatDoc.data() as Chat;
        const updatedDetails = {
          ...existingData.participantDetails,
          [currentUser.uid]: {
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
          },
          [user.uid]: {
            displayName: user.displayName,
            photoURL: user.photoURL
          }
        };
        
        await updateDoc(chatRef, { 
          participantDetails: updatedDetails,
          deletedBy: arrayRemove(currentUser.uid),
          archivedBy: arrayRemove(currentUser.uid),
          restrictedBy: arrayRemove(currentUser.uid)
        });
        setActiveChat({ 
          ...existingData, 
          id: chatDoc.id, 
          participantDetails: updatedDetails,
          deletedBy: (existingData.deletedBy || []).filter(id => id !== currentUser.uid),
          archivedBy: (existingData.archivedBy || []).filter(id => id !== currentUser.uid),
          restrictedBy: (existingData.restrictedBy || []).filter(id => id !== currentUser.uid)
        } as Chat);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'startChat');
    }
  };

  const createGroupChat = async (name: string, participants: string[], duration?: number) => {
    if (!currentUser) return;
    try {
      const chatId = `group_${Date.now()}_${currentUser.uid}`;
      const chatRef = doc(db, 'chats', chatId);
      
      const allParticipants = Array.from(new Set([...participants, currentUser.uid]));
      const participantDetails: any = {};
      
      // Fetch details for all participants
      const detailsTasks = allParticipants.map(async (uid) => {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          const data = userSnap.data() as User;
          participantDetails[uid] = {
            displayName: data.displayName,
            photoURL: data.photoURL
          };
        }
      });
      await Promise.all(detailsTasks);

      const now = Timestamp.now();
      let expiresAt = null;
      if (duration) {
        expiresAt = new Timestamp(now.seconds + duration * 60, now.nanoseconds);
      }

      const newChat: Chat = {
        id: chatId,
        isGroup: true,
        name,
        participants: allParticipants,
        participantDetails,
        updatedAt: serverTimestamp() as Timestamp,
        createdBy: currentUser.uid,
        admins: [currentUser.uid],
        moderators: [],
        expiresAt,
        duration,
        deletedBy: [],
        archivedBy: [],
        restrictedBy: []
      };

      await setDoc(chatRef, newChat);
      setActiveChat(newChat);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'createGroupChat');
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!activeChat || !currentUser) return;
    try {
      const msgRef = doc(db, 'chats', activeChat.id, 'messages', messageId);
      await updateDoc(msgRef, {
        [`reactions.${currentUser.uid}`]: emoji
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${activeChat.id}/messages/${messageId}`);
    }
  };

  const addNoteReaction = async (userId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as User;
      
      const currentReaction = userData.note?.reactions?.[currentUser.uid];
      
      if (currentReaction === emoji) {
        // Remove reaction if clicking the same emoji
        const reactions = { ...userData.note?.reactions };
        delete reactions[currentUser.uid];
        await updateDoc(userRef, {
          'note.reactions': reactions
        });
      } else {
        // Set or replace reaction
        await updateDoc(userRef, {
          [`note.reactions.${currentUser.uid}`]: emoji
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/note_reaction`);
    }
  };

  const deleteMessage = async (messageId: string, mode: 'me' | 'everyone' = 'everyone') => {
    if (!activeChat || !currentUser) return;
    try {
      const msgRef = doc(db, 'chats', activeChat.id, 'messages', messageId);
      if (mode === 'everyone') {
        await updateDoc(msgRef, {
          text: 'This message was deleted',
          type: 'text',
          isDeleted: true,
          fileUrl: null,
          reactions: {}
        });
      } else {
        const msgDoc = await getDoc(msgRef);
        if (msgDoc.exists()) {
          const data = msgDoc.data() as Message;
          const deletedFor = data.deletedFor || [];
          if (!deletedFor.includes(currentUser.uid)) {
            await updateDoc(msgRef, {
              deletedFor: [...deletedFor, currentUser.uid]
            });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${activeChat.id}/messages/${messageId}`);
    }
  };

  const updateGroupMember = async (chatId: string, userId: string, action: 'add' | 'remove' | 'make_admin' | 'make_moderator' | 'remove_admin' | 'remove_moderator') => {
    if (!currentUser) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) return;
      const chatData = chatSnap.data() as Chat;

      const isAdmin = chatData.admins?.includes(currentUser.uid);
      const isModerator = chatData.moderators?.includes(currentUser.uid);

      // Only admins can promote/demote
      if (['make_admin', 'make_moderator', 'remove_admin', 'remove_moderator'].includes(action) && !isAdmin) {
        throw new Error('Only admins can manage roles');
      }

      // Admins and Moderators can add/remove members
      if (['add', 'remove'].includes(action) && !isAdmin && !isModerator) {
        throw new Error('Only admins or moderators can manage members');
      }

      switch (action) {
        case 'add':
          if (chatData.participants.length >= 20) throw new Error('Group is full (max 20)');
          await updateDoc(chatRef, { participants: arrayUnion(userId) });
          break;
        case 'remove':
          await updateDoc(chatRef, { 
            participants: arrayRemove(userId),
            admins: arrayRemove(userId),
            moderators: arrayRemove(userId)
          });
          break;
        case 'make_admin':
          await updateDoc(chatRef, { admins: arrayUnion(userId) });
          break;
        case 'remove_admin':
          await updateDoc(chatRef, { admins: arrayRemove(userId) });
          break;
        case 'make_moderator':
          await updateDoc(chatRef, { moderators: arrayUnion(userId) });
          break;
        case 'remove_moderator':
          await updateDoc(chatRef, { moderators: arrayUnion(userId) });
          break;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/members`);
    }
  };

  const clearChat = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const snapshot = await getDocs(messagesRef);
      const batch = snapshot.docs.map(d => updateDoc(d.ref, { 
        deletedFor: arrayUnion(currentUser.uid) 
      }));
      await Promise.all(batch);
      
      // Also reset unread count for me
      await updateDoc(doc(db, 'chats', chatId), {
        [`unreadCount.${currentUser.uid}`]: 0
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/clear`);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) return;
      
      const chatData = chatSnap.data() as Chat;
      
      if (chatData.participants.length <= 2) {
        // 1-on-1 chat: Delete completely from Firestore for both
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const messagesSnap = await getDocs(messagesRef);
        const msgDeletions = messagesSnap.docs.map(m => deleteDoc(m.ref));
        await Promise.all(msgDeletions);
        await deleteDoc(chatRef);
      } else {
        // Group chat: Just mark as deleted for me
        await updateDoc(chatRef, {
          deletedBy: arrayUnion(currentUser.uid)
        });
      }
      
      if (activeChat?.id === chatId) setActiveChat(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chats/${chatId}`);
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser || !currentUser) return;
    
    const user = auth.currentUser;
    const userId = currentUser.uid;

    // Set a flag to prevent onAuthStateChanged from recreating the doc
    sessionStorage.setItem('isDeletingAccount', 'true');

    try {
      // 0. Explicitly clear note first to trigger listeners immediately
      await updateDoc(doc(db, 'users', userId), {
        note: null,
        isOnline: false,
        lastSeen: serverTimestamp()
      });

      // 1. Delete user's notes subcollection
      const notesRef = collection(db, 'users', userId, 'notes');
      const notesSnap = await getDocs(notesRef);
      const noteDeletions = notesSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(noteDeletions);

      // 2. Delete user's feedback
      const feedbackQuery = query(collection(db, 'feedback'), where('userId', '==', userId));
      const feedbackSnap = await getDocs(feedbackQuery);
      const feedbackDeletions = feedbackSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(feedbackDeletions);

      // 3. Find and handle chats
      const chatsQuery = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
      const chatsSnap = await getDocs(chatsQuery);
      
      const chatTasks = chatsSnap.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data() as Chat;
        if (!chatData.isGroup && chatData.participants.length <= 2) {
          // 1-on-1 chat: Delete everything
          const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
          const messagesSnap = await getDocs(messagesRef);
          const msgDeletions = messagesSnap.docs.map(m => deleteDoc(m.ref));
          await Promise.all(msgDeletions);
          await deleteDoc(chatDoc.ref);
        } else {
          // Group chat: Remove user from participants
          await updateDoc(chatDoc.ref, {
            participants: arrayRemove(userId),
            [`participantDetails.${userId}`]: deleteField(),
            [`unreadCount.${userId}`]: deleteField(),
            [`mutedBy`]: arrayRemove(userId),
            [`archivedBy`]: arrayRemove(userId),
            [`blockedBy`]: arrayRemove(userId),
            [`restrictedBy`]: arrayRemove(userId),
            [`deletedBy`]: arrayRemove(userId)
          });
        }
      });
      await Promise.all(chatTasks);

      // 4. Delete user document from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      // 5. Delete the actual user from Firebase Auth
      await user.delete();
      
      // 6. Logout/Clean up state
      sessionStorage.removeItem('isDeletingAccount');
      setCurrentUser(null);
      setChats([]);
      setActiveChat(null);
    } catch (error: any) {
      sessionStorage.removeItem('isDeletingAccount');
      if (error.code === 'auth/requires-recent-login') {
        await signOut(auth);
        setCurrentUser(null);
        setChats([]);
        setActiveChat(null);
        throw new Error('Your data has been deleted, but for security reasons, please login again and delete your account once more to complete the process.');
      }
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const toggleArchive = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chat = chats.find(c => c.id === chatId);
      const isArchived = chat?.archivedBy?.includes(currentUser.uid);
      
      await updateDoc(chatRef, { 
        archivedBy: isArchived ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/archive`);
    }
  };

  const toggleMute = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chat = chats.find(c => c.id === chatId);
      const isMuted = chat?.mutedBy?.includes(currentUser.uid);

      await updateDoc(chatRef, { 
        mutedBy: isMuted ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/mute`);
    }
  };

  const toggleBlock = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chat = chats.find(c => c.id === chatId);
      const isBlocked = chat?.blockedBy?.includes(currentUser.uid);

      await updateDoc(chatRef, { 
        blockedBy: isBlocked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/block`);
    }
  };

  const toggleRestrict = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chat = chats.find(c => c.id === chatId);
      const isRestricted = chat?.restrictedBy?.includes(currentUser.uid);

      await updateDoc(chatRef, { 
        restrictedBy: isRestricted ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/restrict`);
    }
  };

  const updateChatSettings = async (chatId: string, settings: Partial<Chat>) => {
    if (!currentUser) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/settings`);
    }
  };

  const setNickname = async (chatId: string, userId: string, nickname: string) => {
    if (!currentUser) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`nicknames.${userId}`]: nickname
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/nickname`);
    }
  };

  const reportChat = async (chatId: string, reason: string) => {
    if (!currentUser) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        reports: arrayUnion({
          reporterId: currentUser.uid,
          reason,
          timestamp: serverTimestamp()
        })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/report`);
    }
  };

  const markAsUnread = async (chatId: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        [`unreadCount.${currentUser.uid}`]: 1
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/unread`);
    }
  };

  const setNote = async (text: string) => {
    if (!currentUser) return;
    try {
      const now = Timestamp.now();
      const expiresAt = new Timestamp(now.seconds + 24 * 60 * 60, now.nanoseconds);
      const note = {
        text,
        timestamp: now,
        expiresAt,
        reactions: {}
      };
      await updateDoc(doc(db, 'users', currentUser.uid), { note });
      setCurrentUser(prev => prev ? { ...prev, note } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}/note`);
    }
  };

  const deleteNote = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { note: null });
      setCurrentUser(prev => prev ? { ...prev, note: null } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}/note_delete`);
    }
  };

  const setTyping = async (isTyping: boolean) => {
    if (!currentUser || !activeChat) return;
    const otherUserId = activeChat.participants.find(id => id !== currentUser.uid);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        typingTo: isTyping ? otherUserId : null
      });
    } catch (e) {}
  };

  const uploadFile = async (file: File | Blob, _path: string): Promise<string> => {
    console.log('ChatProvider: Processing file...');
    
    let processedFile = file;
    if (file.type.startsWith('image/')) {
      console.log('ChatProvider: Resizing image...');
      processedFile = await resizeImage(file, 700000); // 700KB target to be safe
    }

    console.log('ChatProvider: Converting file to Base64...');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Check size (Firestore limit is 1MB, base64 adds ~33% overhead)
        const sizeInBytes = (base64String.length * 3) / 4;
        if (sizeInBytes > 900000) { // Slightly higher limit after resizing
          reject(new Error('File is still too large after resizing. Please try a different image.'));
          return;
        }
        console.log('ChatProvider: Conversion successful');
        resolve(base64String);
      };
      reader.onerror = (error) => {
        console.error('ChatProvider: Conversion error', error);
        reject(error);
      };
      reader.readAsDataURL(processedFile);
    });
  };

  // Listen for incoming calls
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'calls'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'ringing'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const callData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Call;
        // Only set if it's a recent call (within 1 minute)
        if (Date.now() - callData.timestamp.toMillis() < 60000) {
          setIncomingCall(callData);
        }
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen for active call status (for the caller)
  useEffect(() => {
    if (!activeCall || activeCall.callerId !== currentUser?.uid) return;

    const unsubscribe = onSnapshot(doc(db, 'calls', activeCall.id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Call;
        if (data.status === 'rejected' || data.status === 'ended') {
          // If the call ended or was rejected, update the message
          if (data.callMessageId) {
            let status: 'missed' | 'completed' | 'declined' = 'completed';
            let duration = 0;
            
            if (data.status === 'rejected') {
              status = 'declined';
            } else if (!data.acceptedAt) {
              status = 'missed';
            } else if (data.endedAt && data.acceptedAt) {
              status = 'completed';
              duration = Math.floor((data.endedAt.toMillis() - data.acceptedAt.toMillis()) / 1000);
            }

            updateDoc(doc(db, 'chats', data.chatId, 'messages', data.callMessageId), {
              'callInfo.status': status,
              'callInfo.duration': duration,
              'status': 'sent'
            }).catch(e => console.error('Error updating call log message:', e));
          }
          setActiveCall(null);
        } else if (data.status === 'accepted') {
          setActiveCall(data);
        }
      } else {
        setActiveCall(null);
      }
    });

    return () => unsubscribe();
  }, [activeCall?.id, currentUser?.uid]);

  const initiateCall = async (chatId: string, receiverId: string, type: 'audio' | 'video') => {
    if (!currentUser) return;

    try {
      // 1. Create the call log message first
      const messageData: Omit<Message, 'id'> = {
        senderId: currentUser.uid,
        timestamp: serverTimestamp() as Timestamp,
        type: 'call',
        callInfo: {
          type,
          status: 'missed', // Default until accepted/completed
          duration: 0
        },
        status: 'sending'
      };
      const msgRef = await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

      // 2. Create the call signaling doc
      const callData: Omit<Call, 'id'> = {
        callerId: currentUser.uid,
        callerName: currentUser.displayName,
        callerPhoto: currentUser.photoURL,
        receiverId,
        chatId,
        type,
        status: 'ringing',
        timestamp: serverTimestamp() as Timestamp,
        callMessageId: msgRef.id
      };

      const docRef = await addDoc(collection(db, 'calls'), callData);
      setActiveCall({ id: docRef.id, ...callData } as Call);

      // Update chat's last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          text: `📞 ${type === 'video' ? 'Video' : 'Audio'} Call`,
          senderId: currentUser.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'calls');
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const now = serverTimestamp();
      await updateDoc(doc(db, 'calls', incomingCall.id), { 
        status: 'accepted',
        acceptedAt: now
      });
      setActiveCall({ ...incomingCall, status: 'accepted' });
      setIncomingCall(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `calls/${incomingCall.id}`);
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'rejected' });
      
      // Also try to update the message if possible (caller's listener usually handles this, but as backup)
      if (incomingCall.callMessageId) {
        updateDoc(doc(db, 'chats', incomingCall.chatId, 'messages', incomingCall.callMessageId), {
          'callInfo.status': 'declined',
          'status': 'sent'
        }).catch(() => {});
      }
      
      setIncomingCall(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `calls/${incomingCall.id}`);
    }
  };

  const endCall = async () => {
    const call = activeCall || incomingCall;
    if (!call) return;
    try {
      const now = Timestamp.now();
      await updateDoc(doc(db, 'calls', call.id), { 
        status: 'ended',
        endedAt: now
      });

      // Update message with duration if it was accepted
      if (call.callMessageId) {
        let status: 'missed' | 'completed' | 'declined' = 'completed';
        let duration = 0;
        
        if (call.status === 'rejected') {
          status = 'declined';
        } else if (!call.acceptedAt) {
          status = 'missed';
        } else {
          status = 'completed';
          const start = call.acceptedAt.toMillis();
          duration = Math.floor((now.toMillis() - start) / 1000);
        }

        updateDoc(doc(db, 'chats', call.chatId, 'messages', call.callMessageId), {
          'callInfo.status': status,
          'callInfo.duration': duration,
          'status': 'sent'
        }).catch(() => {});
      }

      setActiveCall(null);
      setIncomingCall(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `calls/${call.id}`);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      currentUser, loading, chats, activeChat, setActiveChat, 
      messages, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, logout, sendMessage, sendDirectMessage, users, allUsers, searchUsers, 
      startChat, createGroupChat, addReaction, addNoteReaction, deleteMessage, setTyping, updateUserProfile, updateEmailAddress,
      uploadFile, clearChat, deleteChat, deleteAccount, toggleArchive, toggleMute, 
      toggleBlock, toggleRestrict, markAsUnread, setNote, deleteNote, typingUser,
      usersWithNotes, updateChatSettings, setNickname, reportChat, updateGroupMember,
      activeCall, incomingCall, initiateCall, acceptCall, rejectCall, endCall
    }}>
      {children}
    </ChatContext.Provider>
  );
}
