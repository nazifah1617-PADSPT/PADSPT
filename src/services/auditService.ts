import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export async function logActivity(action: string, details: string) {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'audit_logs'), {
      userId: user?.uid || 'SYSTEM',
      userEmail: user?.email || 'SYSTEM',
      action,
      details,
      timestamp: serverTimestamp(),
      // In a real gov system, we'd capture IP via backend
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
