import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, googleProvider, database } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  keepLoggedIn?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, keepLoggedIn?: boolean) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  loginWithGoogle: (keepLoggedIn?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  reauthenticateUser: (password: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user profile in Realtime Database
  const createUserProfile = async (user: User, username: string, photoURL?: string) => {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      username,
      displayName: user.displayName || username,
      photoURL: photoURL || user.photoURL || '',
      emailVerified: user.emailVerified,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, userProfile);
    return userProfile;
  };

  // Get user profile from Realtime Database
  const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Update user profile in Realtime Database
  const updateUserProfileInDB = async (uid: string, updates: Partial<UserProfile>) => {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, {
      ...updates,
      lastLoginAt: new Date().toISOString(),
    });
  };

  // Login with email and password
  const login = async (email: string, password: string, keepLoggedIn = false) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login time
    await updateUserProfileInDB(user.uid, { lastLoginAt: new Date().toISOString() });

    // Store keep logged in preference
    if (keepLoggedIn) {
      localStorage.setItem('keepLoggedIn', 'true');
    } else {
      localStorage.removeItem('keepLoggedIn');
    }
  };

  // Register with email and password
  const register = async (email: string, password: string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: username,
    });

    // Create user profile in Realtime Database
    await createUserProfile(user, username);

    // Send verification email
    await sendEmailVerification(user);
  };

  // Login with Google
  const loginWithGoogle = async (keepLoggedIn = false) => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user profile exists
    let profile = await getUserProfile(user.uid);

    if (!profile) {
      // Create new profile for Google user
      const username = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'user';
      profile = await createUserProfile(user, username, user.photoURL || undefined);
    } else {
      // Update existing profile
      await updateUserProfileInDB(user.uid, {
        photoURL: user.photoURL || profile.photoURL,
        displayName: user.displayName || profile.displayName,
      });
    }

    // Store keep logged in preference
    if (keepLoggedIn) {
      localStorage.setItem('keepLoggedIn', 'true');
    } else {
      localStorage.removeItem('keepLoggedIn');
    }
  };

  // Logout
  const logout = async () => {
    localStorage.removeItem('keepLoggedIn');
    await signOut(auth);
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    if (currentUser) {
      await sendEmailVerification(currentUser);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (currentUser) {
      // Update Firebase Auth profile
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (updates.displayName) authUpdates.displayName = updates.displayName;
      if (updates.photoURL) authUpdates.photoURL = updates.photoURL;

      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(currentUser, authUpdates);
      }

      // Update Realtime Database
      await updateUserProfileInDB(currentUser.uid, updates);
    }
  };

  // Reauthenticate user
  const reauthenticateUser = async (password: string) => {
    if (!currentUser?.email) throw new Error('No user email available');

    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  };

  // Update user password
  const updateUserPassword = async (newPassword: string) => {
    if (!currentUser) throw new Error('No user logged in');

    await updatePassword(currentUser, newPassword);
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      console.log('User details:', user);

      setCurrentUser(user);

      if (user) {
        const profile = await getUserProfile(user.uid);
        console.log('User profile loaded:', profile);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      // Set loading to false after all state updates
      setLoading(false);
      console.log('Loading set to false');
    });

    return unsubscribe;
  }, []);

  // Additional effect to ensure loading is false when we have user data
  useEffect(() => {
    if (currentUser && !loading) {
      console.log('User authenticated and loading complete');
    }
  }, [currentUser, loading]);

  // Debug current state
  console.log('AuthContext - Current state:', {
    currentUser: currentUser ? 'User exists' : 'No user',
    userProfile: userProfile ? 'Profile exists' : 'No profile',
    loading,
  });

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    sendVerificationEmail,
    resetPassword,
    updateUserProfile,
    reauthenticateUser,
    updateUserPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
