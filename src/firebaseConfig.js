import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiRztFjfm96EPEQfWBhhJ6jfMywVvMNmE",
  authDomain: "pyhicaleducation.firebaseapp.com",
  projectId: "pyhicaleducation",
  storageBucket: "pyhicaleducation.firebasestorage.app",
  messagingSenderId: "540710284345",
  appId: "1:540710284345:web:3ec079f0a3b9fe994531e8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);