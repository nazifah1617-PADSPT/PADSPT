import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs, setDoc, getDoc } from 'firebase/firestore';
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
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const userEmail = user.email?.toLowerCase();
      
      const fetchProfile = async () => {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout fetching profile")), 10000)
        );

        try {
          console.log("Fetching profile for:", user.uid);
          const userDocPromise = getDoc(doc(db, 'users', user.uid));
          
          // Race the fetch against the timeout
          const userDoc = await Promise.race([userDocPromise, timeoutPromise]) as any;
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("Profile found:", userData.role);
            
            // Hardcoded super admin check
            if (userEmail === "photonazifah1617@gmail.com" && userData.role !== 'SUPER_ADMIN') {
              const updatedProfile = { ...userData, role: 'SUPER_ADMIN' };
              await setDoc(doc(db, 'users', user.uid), updatedProfile);
              setProfile(updatedProfile);
            } else {
              setProfile(userData);
            }
          } else {
            console.log("No profile found, creating default...");
            // Create profile
            let role = 'USER';
            let name = user.displayName || 'Pengguna';

            if (userEmail === "photonazifah1617@gmail.com") {
              role = 'SUPER_ADMIN';
              name = 'Super Admin';
            } else {
              // Check admin_users
              const q = query(collection(db, 'admin_users'), where('email', '==', userEmail));
              const adminSnap = await getDocs(q);
              if (!adminSnap.empty) {
                const adminData = adminSnap.docs[0].data();
                role = adminData.role || 'ADMIN';
                name = adminData.name || name;
              }
            }

            const newProfile = { 
              role, 
              name, 
              email: userEmail,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Profile fetch error:", error);
          // If it fails, we still want to allow the super admin in
          if (userEmail === "photonazifah1617@gmail.com") {
            setProfile({ role: 'SUPER_ADMIN', name: 'Super Admin', email: userEmail });
          } else {
            // Set a default profile so loading ends
            setProfile({ role: 'USER', name: user.displayName || 'Pengguna', email: userEmail });
          }
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();

      // Set up real-time listener for profile updates
      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          setProfile(snap.data());
        }
      }, (err) => {
        console.error("Profile listener error:", err);
      });

      return () => unsubProfile();
    }
  }, [user]);

  const userEmail = user?.email?.toLowerCase();
  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN' || userEmail === "photonazifah1617@gmail.com";
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN' || userEmail === "photonazifah1617@gmail.com";

  const value = {
    user,
    profile,
    loading: !isAuthReady || (user && loading),
    isAdmin,
    isSuperAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
