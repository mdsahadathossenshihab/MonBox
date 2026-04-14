import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-sw.js";

const firebaseConfig = {
  apiKey: "AIzaSyDmmXsSZWEFPkPAL4Rtn_b4HbrCT3Zdjnk",
  authDomain: "gen-lang-client-0702227978.firebaseapp.com",
  projectId: "gen-lang-client-0702227978",
  storageBucket: "gen-lang-client-0702227978.firebasestorage.app",
  messagingSenderId: "234626667718",
  appId: "1:234626667718:web:0fd014307a62ecd4c0f3c7"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
