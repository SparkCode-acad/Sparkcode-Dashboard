import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { cn, formatRole } from "../../lib/utils";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    GraduationCap,
    BookOpen,
    Settings,
    Bell,
    DollarSign,
    Layers,
    LogOut,
    X
} from 'lucide-react';

interface SidebarProps {
    mobile?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ mobile, onClose }: SidebarProps) => {
    const location = useLocation();
    const { logout, user } = useAuth();
    const { theme, toggleTheme, companyName, logoUrl } = useTheme();
    const [counts, setCounts] = useState({ projects: 0, students: 0, team: 0 });

    useEffect(() => {
        const unsubProjects = onSnapshot(collection(db, "projects"),
            snap => setCounts(prev => ({ ...prev, projects: snap.size })),
            error => console.error("Sidebar Projects Error:", error)
        );
        const unsubStudents = onSnapshot(collection(db, "students"),
            snap => setCounts(prev => ({ ...prev, students: snap.size })),
            error => console.error("Sidebar Students Error:", error)
        );
        const unsubTeam = onSnapshot(collection(db, "team"),
            snap => setCounts(prev => ({ ...prev, team: snap.size })),
            error => console.error("Sidebar Team Error:", error)
        );
        return () => {
            unsubProjects();
            unsubStudents();
            unsubTeam();
        };
    }, []);

    const menuItems = [
        {
            section: "Agency",
            items: [
                { name: "Overview", icon: LayoutDashboard, path: "/" },
                { name: "Team", icon: Users, path: "/team", count: counts.team },
                { name: "Projects", icon: Briefcase, path: "/projects", count: counts.projects },
                { name: "Clients", icon: Users, path: "/clients" },
                { name: "Kanban", icon: Layers, path: "/projects/board" },
            ]
        },
        {
            section: "Academy",
            items: [
                { name: "Dashboard", icon: GraduationCap, path: "/academy" },
                { name: "Students", icon: GraduationCap, path: "/academy/students", count: counts.students },
                { name: "Courses", icon: BookOpen, path: "/academy/courses" },
            ]
        },
        {
            section: "General",
            items: [
                { name: "Finance", icon: DollarSign, path: "/finance" },
                { name: "Notifications", icon: Bell, path: "/notifications" },
                { name: "Settings", icon: Settings, path: "/settings" },
            ]
        }

    ];

    const filteredSections = menuItems.map(section => ({
        ...section,
        items: (section.items as any[]).filter(item => {
            // General access rules
            if (user?.role === 'admin') return true;

            // Student/Guest rules
            if (section.section === "Agency") {
                // Students can only see Overview and Team, not projects/clients
                return item.name === "Overview" || item.name === "Team";
            }

            if (section.section === "General") {
                // Students can only see Notifications
                return item.name === "Notifications";
            }

            return true; // Academy section is open to all for now
        })
    })).filter(section => section.items.length > 0);

    return (
        <aside className={cn(
            "h-full bg-white dark:bg-gray-900 flex flex-col transition-all duration-300",
            mobile ? "w-72" : "w-64"
        )}>
            {/* Header / Logo */}
            <div className="p-6 flex items-center justify-between border-r-2 border-b-2 border-black dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black dark:bg-spark-purple rounded-xl border-2 border-white flex items-center justify-center shadow-neo-sm">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            <Layers className="text-white" size={24} />
                        )}
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tighter dark:text-white uppercase">
                            {companyName || "SPARKCODE"}
                        </h1>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{formatRole(user?.role)}</span>
                        </div>
                    </div>
                </div>
                {mobile && (
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X size={20} className="dark:text-white" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
                {filteredSections.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                            {section.section}
                        </h3>
                        <div className="space-y-2">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={mobile ? onClose : undefined}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 text-sm font-bold border-2 transition-all dark:text-gray-200",
                                            isActive
                                                ? "bg-black text-white border-black shadow-neo-sm dark:bg-spark-purple dark:border-spark-purple"
                                                : "bg-white text-black border-transparent hover:border-black hover:shadow-neo-sm dark:bg-gray-800 dark:hover:border-gray-600"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} />
                                            {item.name}
                                        </div>
                                        {item.count !== undefined && item.count > 0 && (
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                                isActive ? "bg-white text-black" : "bg-black text-white dark:bg-gray-700"
                                            )}>
                                                {item.count}
                                            </span>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t-2 border-black dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-spark-purple rounded-full border-2 border-black dark:border-gray-600 flex items-center justify-center text-xs font-bold text-white">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="overflow-hidden text-black dark:text-white">
                            <div className="flex items-center gap-1">
                                <p className="text-xs font-bold truncate w-20">{user?.name || 'User'}</p>
                                <span className={cn(
                                    "text-[8px] px-1 border border-black rounded shadow-neo-sm font-black uppercase",
                                    user?.role === 'admin' ? "bg-spark-yellow" : "bg-spark-purple text-white"
                                )}>
                                    {formatRole(user?.role)}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-500 truncate w-24">{user?.email || 'Guest'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? '🌙' : '☀️'}
                        </button>
                        <button
                            onClick={logout}
                            className="text-gray-500 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </aside >
    );
};

export default Sidebar;
