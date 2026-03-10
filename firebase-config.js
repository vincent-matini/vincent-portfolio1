// Import the functions you need from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// These values come from Firebase Console -> Project Settings -> Your Apps
export const firebaseConfig = {
  apiKey: "AIzaSyA_My_J6I7UtSahDNLIX3eF28c7rh_T1Fc",
  authDomain: "ptsp-34b78.firebaseapp.com",
  projectId: "ptsp-34b78",
  storageBucket: "ptsp-34b78.firebasestorage.app",
  messagingSenderId: "679438278259",
  appId: "1:679438278259:web:ec27b6f0f93561725d5406",
  measurementId: "G-2W8GMRFQ37"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
const analytics = getAnalytics(app);

// Only these accounts can manage videos in the admin panel
export const adminEmails = [
  "v4313436@gmail.com"
];