import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { CommandPalette } from './CommandPalette';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <CommandPalette />

            {/* Desktop Sidebar */}
            <div className="hidden md:block sticky top-0 h-screen w-64 shrink-0 border-r-2 border-black dark:border-gray-800">
                <Sidebar />
            </div>

            {/* Mobile Sidebar & Backdrop */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 h-full z-50 animate-in slide-in-from-left duration-200">
                        <Sidebar mobile onClose={() => setIsSidebarOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
