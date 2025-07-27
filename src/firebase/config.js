import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// --- IMPORTANT ---
// Replace this entire object with the one you copied from your Firebase project settings.
// This is the most critical step to make your app work.
const firebaseConfig = {
    apiKey: "AIzaSyDbmqD3JDsLGTx9EO-cInLW6GaNWaiA-l0",
    authDomain: "live-quiz-app-87b51.firebaseapp.com",
    projectId: "live-quiz-app-87b51",
    storageBucket: "live-quiz-app-87b51.firebasestorage.app",
    messagingSenderId: "454331533426",
    appId: "1:454331533426:web:b2063cd7dbf5c7b4659aeb"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you'll need
export const db = getFirestore(app);
export const auth = getAuth(app);
