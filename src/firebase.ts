import { initializeApp, getApps, getApp } from "firebase/app";
import { Firestore, initializeFirestore, getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBzCRDBawb84xVE_l917h6c2tIOYLIa1q4",
    authDomain: "sparkcode-dashboard.firebaseapp.com",
    projectId: "sparkcode-dashboard",
    // Note: Newer projects use .firebasestorage.app, older ones use .appspot.com
    // If you get net::ERR_FAILED, ensure CORS is configured in the Firebase Console.
    storageBucket: "sparkcode-dashboard.firebasestorage.app",
    messagingSenderId: "666909699217",
    appId: "1:666909699217:web:f79ef7ad3ed3b434cb6330",
    measurementId: "G-YZVHHLCP42"
};

// 1. Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firestore once with a robust transport configuration
let db: Firestore;
try {
    // Attempt to get existing instance if it exists (HMR safety)
    db = getFirestore(app);
} catch (e) {
    // If it fails or it's the first time, initialize with workaround
    // We disable persistent cache if it's causing 've: -1' assertion errors (which are often cache sync issues)
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true,
        // We explicitly avoid enableIndexedDbPersistence for now as it competes with experimental transport in some environments
    });
}

// 3. Initialize Auth
const auth = getAuth(app);

const analytics = getAnalytics(app);
const storage = getStorage(app);

export { db, auth, analytics, storage };
