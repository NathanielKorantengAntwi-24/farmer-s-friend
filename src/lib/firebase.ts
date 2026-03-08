// src/app/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, collection, addDoc, doc, query, getDocs, getDoc,
  orderBy, updateDoc, deleteDoc, where, 
  setDoc // <--- ADDED THIS IMPORT
} from "firebase/firestore";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBB7-Lvd6ID34n1x6mLJdYjA3ja5QwKKrY",
  authDomain: "farmers-friend-a9997.firebaseapp.com",
  projectId: "farmers-friend-a9997",
  storageBucket: "farmers-friend-a9997.firebasestorage.app",
  messagingSenderId: "342301675273",
  appId: "1:342301675273:web:2249b410fe5f5d5ff6cdd8",
  measurementId: "G-2ES2ZBM9FZ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  db, auth, googleProvider, collection, addDoc, doc, query, getDocs, 
  orderBy, updateDoc, deleteDoc, where,getDoc,
  setDoc, // <--- ADDED THIS EXPORT
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, signInWithPopup, sendPasswordResetEmail 
};