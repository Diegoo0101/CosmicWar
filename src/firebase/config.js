// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCt9MT12f8egTzhu_jKtC9zc4ZQBVAPPmg",
  authDomain: "cosmic-war-7b420.firebaseapp.com",
  projectId: "cosmic-war-7b420",
  storageBucket: "cosmic-war-7b420.firebasestorage.app",
  messagingSenderId: "765542533689",
  appId: "1:765542533689:web:9befb06ab72e1d1e579be8",
  measurementId: "G-WLMR57WR3Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);