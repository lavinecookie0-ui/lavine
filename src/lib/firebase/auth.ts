// src/lib/firebase/auth.ts

import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { User } from '@/types';

// Login with email and password
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: UserCredential; userData: User }> {
  const trimmedEmail = email.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);

  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
  if (!userDoc.exists()) {
    await signOut(auth);
    throw new Error('Kullanıcı profili bulunamadı.');
  }

  const userData = { uid: credential.user.uid, ...userDoc.data() } as User;

  // Check account status
  if (userData.status === 'pending') {
    await signOut(auth);
    throw new Error('PENDING');
  }

  if (userData.status === 'rejected') {
    await signOut(auth);
    throw new Error('REJECTED');
  }

  return { user: credential, userData };
}

// Logout
export async function logout(): Promise<void> {
  await signOut(auth);
}

// Password reset
export async function resetPassword(email: string): Promise<void> {
  const trimmedEmail = email.trim().toLowerCase();
  await sendPasswordResetEmail(auth, trimmedEmail);
}

// Get user data from Firestore
export async function getUserData(uid: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return { uid, ...userDoc.data() } as User;
}
