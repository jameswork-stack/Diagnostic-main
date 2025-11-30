import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCve_5F4o0q-4MUiHJ3cYI_tsymHvgFUXE",
  authDomain: "diagnostic-app-48a54.firebaseapp.com",
  projectId: "diagnostic-app-48a54",
  storageBucket: "diagnostic-app-48a54.firebasestorage.app",
  messagingSenderId: "387508657416",
  appId: "1:387508657416:web:07ef746921736a003ae0bd",
  measurementId: "G-3KYB5H8ZCW"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
