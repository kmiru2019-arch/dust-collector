/**
 * Firebase Auth 헬퍼 — Google + Email/Password + 데모 모드 (집진설비)
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from './config';
import { ensureUserDoc } from './users';

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(getFirebaseAuth(), provider);
  try {
    await ensureUserDoc(result.user.uid, result.user.email ?? '', result.user.displayName ?? undefined);
  } catch (e) {
    console.warn('Firestore user registration failed (non-critical):', e);
  }
  return result.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  try {
    await sendEmailVerification(result.user);
  } catch (e) {
    console.warn('Verification email failed (non-critical):', e);
  }
  try {
    await ensureUserDoc(result.user.uid, result.user.email ?? '', result.user.displayName ?? undefined);
  } catch (e) {
    console.warn('Firestore user registration failed (non-critical):', e);
  }
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  try {
    await ensureUserDoc(result.user.uid, result.user.email ?? '', result.user.displayName ?? undefined);
  } catch (e) {
    console.warn('Firestore user registration failed (non-critical):', e);
  }
  return result.user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

export async function signOut(): Promise<void> {
  if (!isFirebaseConfigured) return;
  await fbSignOut(getFirebaseAuth());
}

export function onAuthChange(cb: (user: User | null) => void): () => void {
  return fbOnAuthStateChanged(getFirebaseAuth(), cb);
}
