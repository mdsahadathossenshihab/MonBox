import { Timestamp } from 'firebase/firestore';

export interface Note {
  text: string;
  timestamp: Timestamp;
  expiresAt: Timestamp;
  reactions?: Record<string, string>; // uid -> emoji
}

export interface User {
  uid: string;
  displayName: string;
  photoURL: string | null;
  email: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  address?: string;
  fcmToken?: string;
  lastSeen?: Timestamp;
  isOnline?: boolean;
  typingTo?: string | null;
  note?: Note | null;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  timestamp: Timestamp;
  type: 'text' | 'image' | 'voice' | 'call';
  callInfo?: {
    type: 'audio' | 'video';
    duration?: number; // in seconds
    status: 'missed' | 'completed' | 'declined';
  };
  reactions?: Record<string, string>;
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  seenBy?: string[];
  fileUrl?: string;
  scheduledFor?: Timestamp | null;
  isDeleted?: boolean;
  deletedFor?: string[];
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  } | null;
}

export interface Chat {
  id: string;
  participants: string[];
  participantDetails?: Record<string, { displayName: string, photoURL: string | null }>;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  } | null;
  updatedAt: Timestamp;
  unreadCount?: Record<string, number>;
  lastRead?: Record<string, Timestamp>;
  archivedBy?: string[];
  mutedBy?: string[];
  blockedBy?: string[];
  restrictedBy?: string[];
  theme?: string;
  customBackground?: string;
  quickEmoji?: string;
  nicknames?: Record<string, string>;
  reports?: { reporterId: string; reason: string; timestamp: Timestamp }[];
  deletedBy?: string[];
  // Group Chat specific
  isGroup?: boolean;
  name?: string;
  groupPhoto?: string | null;
  createdBy?: string;
  admins?: string[];
  moderators?: string[];
  expiresAt?: Timestamp | null;
  duration?: number | null; // in minutes
}

export interface Call {
  id: string;
  callerId: string;
  callerName: string;
  callerPhoto: string | null;
  receiverId: string;
  chatId: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'rejected' | 'ended';
  timestamp: Timestamp;
  acceptedAt?: Timestamp | null;
  endedAt?: Timestamp | null;
  callMessageId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}
