import { createContext, useEffect, useState, type ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    companyName: string;
    setCompanyName: (name: string) => void;
    logoUrl: string;
    setLogoUrl: (url: string) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as Theme) || 'light';
    });

    const [companyName, setCompanyNameState] = useState("Sparkcode");
    const [logoUrl, setLogoUrlState] = useState("");

    // Persist to local storage and DOM
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Sync with Firebase
    useEffect(() => {
        try {
            const unsub = onSnapshot(doc(db, "config", "global_settings"), (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    if (data.theme) setThemeState(data.theme);
                    if (data.companyName) setCompanyNameState(data.companyName);
                    if (data.logoUrl) setLogoUrlState(data.logoUrl);
                }
            }, (error) => {
                console.error("Theme Sync Error:", error);
            });
            return () => unsub();
        } catch (error) {
            console.error("Theme Hook Error:", error);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const setCompanyName = (name: string) => {
        setCompanyNameState(name);
    };

    const setLogoUrl = (url: string) => {
        setLogoUrlState(url);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, companyName, setCompanyName, logoUrl, setLogoUrl }}>
            {children}
        </ThemeContext.Provider>
    );
};
