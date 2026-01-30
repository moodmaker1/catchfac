"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, UserType } from "@/types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  needsProfile: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    company: string,
    userType: UserType
  ) => Promise<void>;
  signInWithGoogle: () => Promise<{ isNewUser: boolean }>;
  completeProfile: (name: string, company: string, userType: UserType) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser && db) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            email: userData.email,
            name: userData.name,
            company: userData.company,
            userType: userData.userType,
            createdAt: userData.createdAt?.toDate() || new Date(),
            sellerTier: userData.sellerTier || (userData.isPremium ? "PREMIUM" : undefined),
            isPremium: userData.isPremium, // 하위 호환성
            isAdmin: userData.isAdmin || false,
          });
          setNeedsProfile(false);
        } else {
          // 구글 로그인 후 프로필 정보가 없는 경우
          setUser(null);
          setNeedsProfile(true);
        }
      } else {
        setUser(null);
        setNeedsProfile(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not initialized");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    company: string,
    userType: UserType
  ) => {
    if (!auth || !db) throw new Error("Firebase not initialized");
    
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await setDoc(doc(db, "users", credential.user.uid), {
      email,
      name,
      company,
      userType,
      createdAt: new Date(),
    });
  };

  const signInWithGoogle = async () => {
    if (!auth || !db) throw new Error("Firebase not initialized");
    
    const result = await signInWithPopup(auth, googleProvider);
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    
    if (!userDoc.exists()) {
      setNeedsProfile(true);
      return { isNewUser: true };
    }
    
    return { isNewUser: false };
  };

  const completeProfile = async (name: string, company: string, userType: UserType) => {
    if (!auth || !db || !firebaseUser) throw new Error("Not authenticated");

    await setDoc(doc(db, "users", firebaseUser.uid), {
      email: firebaseUser.email,
      name,
      company,
      userType,
      createdAt: new Date(),
    });

    const updatedUserDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (updatedUserDoc.exists()) {
      const userData = updatedUserDoc.data();
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name,
        company,
        userType,
        createdAt: new Date(),
        isAdmin: userData.isAdmin || false,
      });
    } else {
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name,
        company,
        userType,
        createdAt: new Date(),
        isAdmin: false,
      });
    }
    setNeedsProfile(false);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUser(null);
    setNeedsProfile(false);
  };

  return (
    <AuthContext.Provider
      value={{ 
        firebaseUser, 
        user, 
        loading, 
        needsProfile,
        signIn, 
        signUp, 
        signInWithGoogle,
        completeProfile,
        signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
