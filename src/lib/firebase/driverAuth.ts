// src/lib/firebase/driverAuth.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig, db } from './config';
import { Driver, User } from '@/types';

// Initialize a secondary app so we don't log out the current admin
export const createDriverAccount = async (
  driverData: Omit<Driver, 'id' | 'userId' | 'createdAt'>,
  password: string
): Promise<string> => {
  const SECONDARY_APP_NAME = 'SecondaryApp';
  let secondaryApp = getApps().find(app => app.name === SECONDARY_APP_NAME);
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  }

  const secondaryAuth = getAuth(secondaryApp);

  try {
    // 1. Create the user in Firebase Auth using the secondary app
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, driverData.email, password);
    const newUid = userCredential.user.uid;

    // 2. Create the user document in the 'users' collection
    const userRef = doc(db, 'users', newUid);
    const newUserDoc: User = {
      uid: newUid,
      email: driverData.email,
      role: 'driver',
      status: 'active',
      createdAt: serverTimestamp() as any,
    };
    await setDoc(userRef, newUserDoc);

    // 3. Create the driver document in the 'drivers' collection
    const driverRef = doc(db, 'drivers', newUid); // Use same UID for driver doc
    const newDriverDoc: Driver = {
      ...driverData,
      id: newUid,
      userId: newUid,
      status: 'active',
      createdAt: serverTimestamp() as any,
    };
    await setDoc(driverRef, newDriverDoc);

    // 4. Sign out the secondary app immediately so it doesn't linger
    await signOut(secondaryAuth);

    return newUid;
  } catch (error: any) {
    console.error("Error creating driver account:", error);
    // Ensure secondary app signs out even if there is an error
    await signOut(secondaryAuth);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Bu e-posta adresiyle zaten bir hesap mevcut.');
    }
    throw error;
  }
};
