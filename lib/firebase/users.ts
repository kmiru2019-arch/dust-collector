/**
 * 사용자 / Tier 관리 — Firestore users/{uid}
 * (집진설비 — 로그인·등급 관리용 최소 구성)
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type FieldValue } from 'firebase/firestore';
import { getDb } from './config';

export type UserTier = 'free' | 'token' | 'pro' | 'premium' | 'lifetime';

export type UserDoc = {
  email: string;
  display_name?: string;
  tier: UserTier;
  tokens?: number;
  usage: {
    designs_count: number;
    pdfs_downloaded: number;
    last_active?: FieldValue;
  };
  created_at?: FieldValue;
};

export async function ensureUserDoc(uid: string, email: string, displayName?: string): Promise<UserDoc> {
  const ref = doc(getDb(), 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    // lastActive 갱신 (비차단)
    try {
      await updateDoc(ref, { 'usage.last_active': serverTimestamp() });
    } catch {
      // 무시
    }
    return snap.data() as UserDoc;
  }
  const newDoc: UserDoc = {
    email,
    display_name: displayName,
    tier: 'free',
    usage: {
      designs_count: 0,
      pdfs_downloaded: 0,
      last_active: serverTimestamp(),
    },
    created_at: serverTimestamp(),
  };
  await setDoc(ref, newDoc);
  return newDoc;
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const ref = doc(getDb(), 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserDoc) : null;
}
