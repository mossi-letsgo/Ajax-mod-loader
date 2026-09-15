import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Firebase Configuration ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyCsZOSMWJHEPvN4wd44u5coQU3Esslu9bM",
  authDomain: "fornikka-2000c.firebaseapp.com",
  projectId: "fornikka-2000c",
  storageBucket: "fornikka-2000c.firebasestorage.app",
  messagingSenderId: "573787085567",
  appId: "1:573787085567:web:813859e45e974c94068aca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Services เพื่อนำไปใช้ใน JS ไฟล์อื่น
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);