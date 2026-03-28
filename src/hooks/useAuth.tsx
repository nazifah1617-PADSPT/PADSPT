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
      const userEmail = user.email?.toLowerCase().trim();
      
      const fetchProfile = async () => {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout fetching profile")), 10000)
        );

        try {
          console.log("Fetching profile for UID:", user.uid, "Email:", userEmail);
          const userDocPromise = getDoc(doc(db, 'users', user.uid));
          
          // Race the fetch against the timeout
          const userDoc = await Promise.race([userDocPromise, timeoutPromise]) as any;
          
          let userData = userDoc.exists() ? userDoc.data() : null;
          let role = userData?.role || 'USER';
          let name = userData?.name || user.displayName || 'Pengguna';

          console.log("Initial role from Firestore:", role);

          // 1. Hardcoded Super Admin Check
          if (userEmail === "photonazifah1617@gmail.com" || userEmail === "data1617@gmail.com") {
            role = 'SUPER_ADMIN';
            name = userEmail === "data1617@gmail.com" ? 'Pindah Data' : 'Super Admin';
            console.log("Promoted to SUPER_ADMIN via hardcode");
          } 
          // 3. Check admin_users collection if they are currently a USER
          else if (role === 'USER') {
            console.log("Checking admin_users for email:", userEmail);
            const adminDoc = await getDoc(doc(db, 'admin_users', userEmail));
            if (adminDoc.exists()) {
              const adminData = adminDoc.data();
              role = adminData.role || 'ADMIN';
              name = adminData.name || name;
              console.log("Promoted to", role, "via admin_users collection");
            } else {
              console.log("No match in admin_users for:", userEmail);
            }
          }

          const finalProfile = {
            ...userData,
            role,
            name,
            email: userEmail,
            updatedAt: new Date().toISOString()
          };

          // Update Firestore if role changed or profile didn't exist
          if (!userDoc.exists() || userData.role !== role) {
            console.log("Syncing role to Firestore users collection:", role);
            await setDoc(doc(db, 'users', user.uid), finalProfile, { merge: true });
          }
          
          setProfile(finalProfile);
        } catch (error) {
          console.error("Profile fetch error:", error);
          // Fallback logic
          const fallbackRole = (userEmail === "photonazifah1617@gmail.com") ? 'SUPER_ADMIN' : 'USER';
          setProfile({ role: fallbackRole, name: user.displayName || 'Pengguna', email: userEmail });
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
  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN' || userEmail === "photonazifah1617@gmail.com" || userEmail === "data1617@gmail.com";
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN' || userEmail === "photonazifah1617@gmail.com" || userEmail === "data1617@gmail.com";

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
