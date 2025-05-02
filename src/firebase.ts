
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD86A76TF5NQCLRzyQJyjkwO2sqpWPQQ4c",
  authDomain: "raccoonbot---mapache.firebaseapp.com",
  projectId: "raccoonbot---mapache",
  storageBucket: "raccoonbot---mapache.firebasestorage.app",
  messagingSenderId: "1022504551641",
  appId: "1:1022504551641:web:fae370a64c8a83e7172ac8",
  measurementId: "G-JV01RFDXYM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };
