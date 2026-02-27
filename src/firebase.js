import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTLpYdsknVDIoqkcgOyc1xR7JzwATngIA",
  authDomain: "booklubbing-7fcb0.firebaseapp.com",
  projectId: "booklubbing-7fcb0",
  storageBucket: "booklubbing-7fcb0.firebasestorage.app",
  messagingSenderId: "745586234391",
  appId: "1:745586234391:web:8ba7252cdfa28df5e17852"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
