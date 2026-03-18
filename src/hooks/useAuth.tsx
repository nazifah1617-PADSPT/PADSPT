import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          // Default admin for the provided email
          if (user.email === "photonazifah1617@gmail.com") {
            setProfile({ role: 'SUPER_ADMIN', name: 'Super Admin' });
          } else {
            setProfile(null);
          }
        }
        setLoading(false);
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
