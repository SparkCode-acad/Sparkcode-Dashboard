import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DollarSign, Users, Briefcase, TrendingUp, ArrowUpRight, BarChart3 } from "lucide-react";
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNotifications } from "../context/NotificationContext";
import { SkeletonCard, Skeleton } from "../components/ui/Skeleton";
import { cn } from "../lib/utils";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
    const { activities } = useNotifications();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        revenue: 0,
        activeProjects: 0,
        activeStudents: 0,
        growth: "24%"
    });
    const [revenueData, setRevenueData] = useState<{ name: string, revenue: number }[]>([]);
    const [studentGrowthData, setStudentGrowthData] = useState<{ name: string, count: number }[]>([]);

    useEffect(() => {
        setLoading(true);

        const unsubProjects = onSnapshot(collection(db, "projects"),
            (snapshot) => {
                const projects = snapshot?.docs?.map(doc => ({ id: doc.id, ...doc.data() })) || [];
                const activeCount = projects.filter((p: any) => p?.status === 'In Progress').length || 0;

                // 1. Calculate stats
                let totalBudget = 0;
                const monthlyRevenue: Record<string, number> = {
                    'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0, 'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0
                };

                projects.forEach((p: any) => {
                    const budgetStr = p.budget || "0";
                    const numericBudget = parseInt(budgetStr.replace(/[^0-9.-]+/g, "")) || 0;
                    totalBudget += numericBudget;

                    const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
                    const month = date.toLocaleString('default', { month: 'short' });
                    if (monthlyRevenue[month] !== undefined) {
                        monthlyRevenue[month] += numericBudget;
                    }
                });

                setStats(prev => ({
                    ...prev,
                    activeProjects: activeCount,
                    revenue: totalBudget
                }));

                // 2. Prepare chart data (last 7 months for display)
                const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentMonthIdx = new Date().getMonth();
                const displayMonths = [];
                for (let i = 6; i >= 0; i--) {
                    const idx = (currentMonthIdx - i + 12) % 12;
                    displayMonths.push({
                        name: monthOrder[idx],
                        revenue: monthlyRevenue[monthOrder[idx]] || 0
                    });
                }
                setRevenueData(displayMonths);

                // 3. Calculate Growth (Current month vs Last month)
                const thisMonth = monthOrder[currentMonthIdx];
                const lastMonth = monthOrder[(currentMonthIdx - 1 + 12) % 12];
                const currentRev = monthlyRevenue[thisMonth] || 0;
                const pastRev = monthlyRevenue[lastMonth] || 0;

                let growthStr = "0%";
                if (pastRev > 0) {
                    const growthNum = ((currentRev - pastRev) / pastRev) * 100;
                    growthStr = `${growthNum >= 0 ? '+' : ''}${growthNum.toFixed(1)}%`;
                } else if (currentRev > 0) {
                    growthStr = "+100%";
                }

                setStats(prev => ({
                    ...prev,
                    growth: growthStr
                }));
            },
            (error) => console.error("Dashboard Projects Error:", error)
        );

        const unsubStudents = onSnapshot(collection(db, "students"),
            (snapshot) => {
                const studentsData = snapshot?.docs?.map(doc => doc.data()) || [];
                setStats(prev => ({
                    ...prev,
                    activeStudents: snapshot?.size || 0
                }));

                // Group students by Day of Week
                const weeklyStats: Record<string, number> = {
                    'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
                };

                studentsData.forEach((s: any) => {
                    const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date();
                    const day = date.toLocaleString('default', { weekday: 'short' });
                    if (weeklyStats[day] !== undefined) {
                        weeklyStats[day]++;
                    }
                });

                setStudentGrowthData([
                    { name: 'Mon', count: weeklyStats['Mon'] },
                    { name: 'Tue', count: weeklyStats['Tue'] },
                    { name: 'Wed', count: weeklyStats['Wed'] },
                    { name: 'Thu', count: weeklyStats['Thu'] },
                    { name: 'Fri', count: weeklyStats['Fri'] },
                    { name: 'Sat', count: weeklyStats['Sat'] },
                    { name: 'Sun', count: weeklyStats['Sun'] },
                ]);

                setLoading(false);
            },
            (error) => {
                console.error("Dashboard Students Error:", error);
                setLoading(false);
            }
        );

        return () => {
            unsubProjects();
            unsubStudents();
        };
    }, []);

    const statCards = [
        {
            title: "Total Revenue",
            value: `$${(stats?.revenue || 0).toLocaleString()}`,
            change: "+12.5% from last month",
            icon: DollarSign,
            color: "bg-green-100",
            trend: "up",
            isAdminOnly: true
        },
        {
            title: "Active Projects",
            value: (stats?.activeProjects || 0).toString(),
            change: "Current Workload",
            icon: Briefcase,
            color: "bg-blue-100",
            trend: "neutral"
        },
        {
            title: "Active Students",
            value: (stats?.activeStudents || 0).toString(),
            change: "Total Enrolled",
            icon: Users,
            color: "bg-yellow-100",
            trend: "up"
        },
        {
            title: "Growth Rate",
            value: stats?.growth || "0%",
            change: "Steady increase",
            icon: TrendingUp,
            color: "bg-purple-100",
            trend: "up",
            isAdminOnly: true
        }
    ].filter(card => !card.isAdminOnly || user?.role === 'admin');

    if (loading) {
        return (
            <div className="space-y-6 pb-20">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-[400px] lg:col-span-2 rounded-xl border-2 border-black" />
                    <Skeleton className="h-[400px] rounded-xl border-2 border-black" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold dark:text-white">Dashboard Overview</h2>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-700 px-3 py-1 shadow-neo-sm">
                    Live Updates Active
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards
                    .map((stat, index) => (
                        <Card key={index} className="transition-all hover:translate-y-[-4px] hover:shadow-neo-lg dark:bg-gray-800 dark:border-gray-700 overflow-hidden relative group">
                            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150", stat.color)} />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
                                <CardTitle className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    {stat.title}
                                </CardTitle>
                                <div className={cn("p-2 rounded-lg border-2 border-black shadow-neo-sm dark:border-gray-600 transition-colors", stat.color)}>
                                    <stat.icon size={18} className="text-black" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black dark:text-white mb-1">{stat.value}</div>
                                <div className="flex items-center gap-1">
                                    {stat.trend === 'up' && <ArrowUpRight size={14} className="text-green-500" />}
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.change}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Revenue Chart - ADMIN ONLY */}
                {user?.role === 'admin' && (
                    <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader className="border-b-2 border-dashed border-gray-100 dark:border-gray-700">
                            <CardTitle className="flex items-center gap-2 dark:text-white">
                                <TrendingUp size={20} className="text-spark-orange" /> Revenue Growth
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#000',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#f97316"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Smaller Activity Chart */}
                <Card className={cn("dark:bg-gray-800 dark:border-gray-700", user?.role !== 'admin' && "lg:col-span-3")}>
                    <CardHeader className="border-b-2 border-dashed border-gray-100 dark:border-gray-700">
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <BarChart3 size={20} className="text-spark-purple" /> Weekly Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={studentGrowthData}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#9ca3af"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: '2px solid black' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {studentGrowthData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#ec4899'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1 dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between border-b-2 border-gray-100 dark:border-gray-700 pb-4">
                        <CardTitle className="dark:text-white text-lg font-black uppercase tracking-wider">Activity Feed</CardTitle>
                        <div className="bg-black text-white px-3 py-1 rounded-sm text-[10px] font-black shadow-neo-sm uppercase tracking-widest border border-white">
                            Real-Time
                        </div>
                    </CardHeader>
                    <CardContent className="max-h-[350px] overflow-y-auto space-y-3 pt-4 pr-2">
                        {activities.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 italic text-center py-10">No recent activity logged</p>
                        ) : (
                            activities.map(activity => (
                                <div key={activity.id} className={`p-3 border-2 border-black dark:border-gray-600 shadow-neo-sm bg-white dark:bg-gray-900 border-l-8 transition-all hover:scale-[1.01] ${activity.type === 'success' ? 'border-l-green-400' :
                                    activity.type === 'error' ? 'border-l-red-400' :
                                        activity.type === 'warning' ? 'border-l-yellow-400' : 'border-l-blue-400'
                                    }`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{activity.user || 'System'}</span>
                                        <span className="text-[10px] text-gray-400 font-mono italic">
                                            {activity.createdAt?.toDate ? activity.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold dark:text-white leading-tight">{activity.message}</p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1 dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="border-b-2 border-gray-100 dark:border-gray-700 pb-4">
                        <CardTitle className="dark:text-white font-black uppercase tracking-wider">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                className="flex flex-col items-center justify-center p-6 border-2 border-black dark:border-gray-600 bg-white dark:bg-gray-900 shadow-neo-sm hover:shadow-neo-lg hover:-translate-y-1 transition-all group"
                                onClick={() => window.location.href = '/projects'}
                            >
                                <div className="p-3 bg-spark-orange rounded-full border-2 border-black mb-3 group-hover:rotate-12 transition-transform shadow-neo-sm">
                                    <Briefcase size={24} className="text-black" />
                                </div>
                                <span className="font-black text-xs uppercase dark:text-white">New Project</span>
                            </button>
                            <button
                                className="flex flex-col items-center justify-center p-6 border-2 border-black dark:border-gray-600 bg-white dark:bg-gray-900 shadow-neo-sm hover:shadow-neo-lg hover:-translate-y-1 transition-all group"
                                onClick={() => window.location.href = '/academy'}
                            >
                                <div className="p-3 bg-spark-purple rounded-full border-2 border-black mb-3 group-hover:-rotate-12 transition-transform shadow-neo-sm text-white">
                                    <Users size={24} />
                                </div>
                                <span className="font-black text-xs uppercase dark:text-white">Enroll Student</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
