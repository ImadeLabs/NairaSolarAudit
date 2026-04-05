// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {

  apiKey: "AIzaSyDs8J-e-wqgYwamc00WOl_08DFpPqQoA1k",

  authDomain: "nairasolar-c2972.firebaseapp.com",

  projectId: "nairasolar-c2972",

  storageBucket: "nairasolar-c2972.firebasestorage.app",

  messagingSenderId: "180917483751",

  appId: "1:180917483751:web:07ca4f4cbbd036b1e08a42",

  measurementId: "G-6752HQSHY1"

};


// Initialize Firebase (Checks if it's already running to prevent errors)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db };