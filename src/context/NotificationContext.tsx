import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface Activity {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    createdAt: any;
    read: boolean;
    user?: string;
}

interface ActivityContextType {
    activities: Activity[];
    logActivity: (message: string, type?: Activity['type'], user?: string) => Promise<void>;
    unreadCount: number;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, "activity_feed"),
            orderBy("createdAt", "desc"),
            limit(15)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Activity[];
            setActivities(data);
        });

        return () => unsubscribe();
    }, []);

    const logActivity = async (message: string, type: Activity['type'] = 'info', user: string = 'System') => {
        try {
            await addDoc(collection(db, "activity_feed"), {
                message,
                type,
                user,
                createdAt: Timestamp.now(),
                read: false
            });
        } catch (error) {
            console.error("Error logging activity:", error);
        }
    };

    const unreadCount = activities.filter(n => !n.read).length;

    return (
        <ActivityContext.Provider value={{ activities, logActivity, unreadCount }}>
            {children}
        </ActivityContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(ActivityContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
