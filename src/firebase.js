import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcNNnxGMvaZDCq85_ruMMHvMv0eVB0zZk",
  authDomain: "vrane-ai-mvp.firebaseapp.com",
  projectId: "vrane-ai-mvp",
  storageBucket: "vrane-ai-mvp.appspot.com",
  messagingSenderId: "45160029262",
  appId: "1:45160029262:web:de0d0ec70692bfbd90f71f",
  measurementId: "G-MDXNH0YFPP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };