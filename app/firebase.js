// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOA-Ahe2epuYZSB_gkNtEl5rSQsCBnRCE",
  authDomain: "inventory-management-sys-61301.firebaseapp.com",
  projectId: "inventory-management-sys-61301",
  storageBucket: "inventory-management-sys-61301.appspot.com",
  messagingSenderId: "623034290338",
  appId: "1:623034290338:web:3adb310c439d607d5f07fb",
  measurementId: "G-VZ2MSXXS0Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, firestore, storage };

