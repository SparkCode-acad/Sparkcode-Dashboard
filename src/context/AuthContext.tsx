import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        let unsubscribeFromUserDoc: (() => void) | undefined;
        const SUPER_ADMIN_EMAILS = ['admin@sparkcode.com', 'zayd@sparkcode.com']; // Add your admin emails here

        const unsubscribeFromAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(firebaseUser.email || '');

                unsubscribeFromUserDoc = onSnapshot(userDocRef, (docSnap) => {
                    console.log("Auth Snapshot update for", firebaseUser.email, "IsSuperAdmin:", isSuperAdmin);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUser({
                            id: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            name: data.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                            role: isSuperAdmin ? 'admin' : (data.role || 'student')
                        });
                    } else {
                        // Default logic for users without a Firestore document
                        setUser({
                            id: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                            role: isSuperAdmin ? 'admin' : 'student'
                        });
                    }
                    setIsAuthenticated(true);
                    setLoading(false);
                }, (error) => {
                    console.error("Auth Snapshot Error:", error);
                    setLoading(false);
                });
            } else {
                if (unsubscribeFromUserDoc) unsubscribeFromUserDoc();
                setUser(null);
                setIsAuthenticated(false);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeFromAuth();
            if (unsubscribeFromUserDoc) unsubscribeFromUserDoc();
        };
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
