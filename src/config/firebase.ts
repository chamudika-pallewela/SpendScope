import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBydBBAG7tiCR8sNyL4OEhhILGtFhBVYhY',
  authDomain: 'bankwise-52091.firebaseapp.com',
  databaseURL: 'https://bankwise-52091-default-rtdb.firebaseio.com',
  projectId: 'bankwise-52091',
  storageBucket: 'bankwise-52091.firebasestorage.app',
  messagingSenderId: '71580173985',
  appId: '1:71580173985:web:a36ee1d65f37fa315d52e0',
  measurementId: 'G-0NF3FEYZEZ',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;
