import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
        if (snap.exists()) {
          const userData = snap.data();
          
          // Hardcoded super admin check
          if (user.email === "photonazifah1617@gmail.com" && userData.role !== 'SUPER_ADMIN') {
            const updatedProfile = { ...userData, role: 'SUPER_ADMIN' };
            await setDoc(doc(db, 'users', user.uid), updatedProfile);
            setProfile(updatedProfile);
            setLoading(false);
            return;
          }

          // If role is not admin, check admin_users just in case it was updated there but not synced
          if (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN') {
            try {
              const q = query(collection(db, 'admin_users'), where('email', '==', user.email));
              const adminSnap = await getDocs(q);
              if (!adminSnap.empty) {
                const adminData = adminSnap.docs[0].data();
                const updatedProfile = { 
                  ...userData,
                  role: adminData.role || 'ADMIN', 
                  name: adminData.name || userData.name || user.displayName || 'Admin'
                };
                await setDoc(doc(db, 'users', user.uid), updatedProfile);
                setProfile(updatedProfile);
                setLoading(false);
                return;
              }
            } catch (error) {
              console.error("Admin re-check error:", error);
            }
          }
          setProfile(userData);
          setLoading(false);
        } else {
          // Check if email is in admin_users
          try {
            const q = query(collection(db, 'admin_users'), where('email', '==', user.email));
            const adminSnap = await getDocs(q);
            
            if (!adminSnap.empty) {
              const adminData = adminSnap.docs[0].data();
              const newProfile = { 
                role: adminData.role || 'ADMIN', 
                name: adminData.name || user.displayName || 'Admin',
                email: user.email
              };
              // Auto-create user profile
              await setDoc(doc(db, 'users', user.uid), newProfile);
              setProfile(newProfile);
            } else if (user.email === "photonazifah1617@gmail.com") {
              const superAdminProfile = { role: 'SUPER_ADMIN', name: 'Super Admin', email: user.email };
              await setDoc(doc(db, 'users', user.uid), superAdminProfile);
              setProfile(superAdminProfile);
            } else {
              setProfile(null);
            }
          } catch (error) {
            console.error("Admin check error:", error);
            setProfile(null);
          }
          setLoading(false);
        }
      }, (err) => {
        console.error("Profile fetch error:", err);
        setLoading(false);
      });
      return unsubscribe;
    }
  }, [user]);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN',
    isSuperAdmin: profile?.role === 'SUPER_ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
