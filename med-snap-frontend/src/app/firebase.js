import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
//Firebase
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);