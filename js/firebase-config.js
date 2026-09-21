// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFMNMTQtvtYvatwYJGEk_2ebUTkAzVKPE",
  authDomain: "antvx-ceb2f.firebaseapp.com",
  projectId: "antvx-ceb2f",
  storageBucket: "antvx-ceb2f.firebasestorage.app",
  messagingSenderId: "8711504283",
  appId: "1:8711504283:web:7dcf3f9d6795310c08a13e",
  measurementId: "G-1CCHNXREEE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
