import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bell, Send, CheckCircle, Info, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn, formatRole } from '../lib/utils';

const Notifications = () => {
    const { activities, logActivity, markAllAsRead } = useNotifications();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [sending, setSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        try {
            await logActivity(message, type, user?.name || 'System', user?.role || 'student');
            setMessage('');
            showToast(user?.role === 'admin' ? "Announcement broadcasted!" : "Message sent to team!");
        } catch (error) {
            console.error("Error sending notification:", error);
        } finally {
            setSending(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-green-500" size={18} />;
            case 'warning': return <AlertTriangle className="text-yellow-500" size={18} />;
            case 'error': return <XCircle className="text-red-500" size={18} />;
            default: return <Info className="text-blue-500" size={18} />;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h2 className="text-3xl font-bold dark:text-white text-black">Notifications</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">System announcements and activity feed</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Send Notification Form */}
                <Card className="lg:col-span-1 dark:bg-gray-800 dark:border-gray-700 h-fit">
                    <CardHeader className="border-b-black dark:border-gray-600">
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <Send size={20} /> {user?.role === 'admin' ? 'Send Announcement' : 'Send Message'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSend} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold dark:text-gray-300">Message</label>
                                <textarea
                                    className="w-full p-3 border-2 border-black dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-spark-orange outline-none resize-none h-32"
                                    placeholder={user?.role === 'admin' ? "Type announcement here..." : "Type your message or feedback for the team..."}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold dark:text-gray-300">Notification Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['info', 'success', 'warning', 'error'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setType(t)}
                                            className={cn(
                                                "px-3 py-2 text-xs font-bold border-2 transition-all capitalize",
                                                type === t
                                                    ? "bg-black text-white border-black dark:bg-spark-purple dark:border-spark-purple"
                                                    : "border-gray-200 text-gray-400 hover:border-black dark:border-gray-700 dark:hover:border-gray-500"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={sending}>
                                {sending ? 'Sending...' : 'Broadcast Announcement'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="border-b-black dark:border-gray-600 flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <Bell size={20} /> Latest Activity
                        </CardTitle>
                        {activities.some(a => !a.read) && (
                            <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-spark-purple">
                                Mark all as read
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y-2 divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                            {activities.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 font-bold">
                                    No activities logged yet.
                                </div>
                            ) : (
                                activities.map((activity) => (
                                    <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex gap-4">
                                        <div className="mt-1">
                                            {getTypeIcon(activity.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold dark:text-white text-black">{activity.message}</p>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} /> {activity.createdAt?.toDate ? activity.createdAt.toDate().toLocaleString() : 'Just now'}
                                                </span>
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                    BY: {activity.user || 'System'}
                                                    {activity.userRole && (
                                                        <span className={cn(
                                                            "text-[8px] px-1 border border-black rounded shadow-neo-sm font-black uppercase",
                                                            activity.userRole === 'admin' ? "bg-spark-yellow text-black" :
                                                                activity.userRole === 'System' ? "bg-black text-white" : "bg-spark-purple text-white"
                                                        )}>
                                                            {formatRole(activity.userRole)}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Notifications;
