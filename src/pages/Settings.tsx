import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Lock, Bell, Globe, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../hooks/useTheme';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const Settings = () => {
    const { user } = useAuth();
    const { logActivity } = useNotifications();
    const { theme, setTheme, companyName, setCompanyName, logoUrl, setLogoUrl } = useTheme();

    // Internal state for form handling
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [localCompanyName, setLocalCompanyName] = useState(companyName);
    const [localTheme, setLocalTheme] = useState(theme);
    const [localLogoUrl, setLocalLogoUrl] = useState(logoUrl);
    const [uploading, setUploading] = useState(false);

    // Sync local state with context when context updates (e.g. from Firebase)
    useEffect(() => {
        setLocalCompanyName(companyName);
        setLocalTheme(theme);
        setLocalLogoUrl(logoUrl);
    }, [companyName, theme, logoUrl]);

    // Settings State
    const [profile, setProfile] = useState({
        name: user?.name || 'Admin User',
        email: user?.email || 'admin@sparkcode.com',
        role: 'Super Admin'
    });

    const [security, setSecurity] = useState({
        currentPassword: '',
        newPassword: ''
    });

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        projectCreated: true,
        studentEnrollment: true
    });

    // Load Notifications from Firebase
    useEffect(() => {
        const fetchSettings = async () => {
            // We can keep notifications in 'settings/general' or move to 'config/global_settings'. 
            // Requirement only specified 'Company Name' and 'Dashboard Theme' for Global Settings.
            // We will stick to the plan and keep notifications where they were for now, or move them if needed.
            // Let's keep them in 'settings/general' to avoid migrating everything if not requested.
            try {
                const docRef = doc(db, "settings", "general");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.notifications) setNotifications(data.notifications);
                }
            } catch (error) {
                console.error("Error loading settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            console.log("No file selected");
            return;
        }

        console.log("Starting upload for file:", file.name, "Size:", file.size);
        setUploading(true);
        try {
            const storagePath = `logos/dashboard_logo_${Date.now()}`;
            console.log("Storage path:", storagePath);
            const storageRef = ref(storage, storagePath);

            console.log("Calling uploadBytes...");
            const snapshot = await uploadBytes(storageRef, file);
            console.log("Upload successful, snapshot:", snapshot);

            console.log("Getting download URL...");
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log("Download URL obtained:", downloadURL);

            setLocalLogoUrl(downloadURL);
            await logActivity(`Uploaded new dashboard logo`, 'info', user?.name);
            console.log("Activity logged");
        } catch (error: any) {
            console.error("Detailed error uploading logo:", error);
            alert("Error uploading logo: " + error.message);
        } finally {
            console.log("Upload process finished (finally)");
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setSuccessMessage('');
        try {
            // Save Global Config
            await setDoc(doc(db, "config", "global_settings"), {
                companyName: localCompanyName,
                theme: localTheme,
                logoUrl: localLogoUrl,
                updatedAt: new Date(),
                updatedBy: user?.email
            }, { merge: true });

            // Optimistically update Context
            setCompanyName(localCompanyName);
            setTheme(localTheme);
            setLogoUrl(localLogoUrl);

            await logActivity(`Updated system configuration`, 'info', user?.name);

            setSuccessMessage("Settings saved successfully!");
            setSecurity({ currentPassword: '', newPassword: '' });

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error: any) {
            console.error("Error saving settings", error);
            alert("Error saving settings: " + (error.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Success Message Toast */}
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50 animate-fade-in-down font-bold">
                    {successMessage}
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white">Settings</h2>
                    <p className="text-gray-500 font-medium dark:text-gray-400">System configuration and profile preferences</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 animate-spin" size={18} /> : <Save size={18} className="mr-2" />}
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Global Configuration */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="border-b-black dark:border-gray-600">
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <Globe size={20} /> Global Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold dark:text-gray-300">Company Name</label>
                            <Input
                                value={localCompanyName}
                                onChange={(e) => setLocalCompanyName(e.target.value)}
                                placeholder="e.g. Sparkcode"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold dark:text-gray-300">Dashboard Logo</label>
                            <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                                    {localLogoUrl ? (
                                        <img src={localLogoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <Globe size={24} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className="inline-flex items-center px-4 py-2 bg-black dark:bg-spark-purple text-white text-sm font-bold rounded cursor-pointer hover:opacity-90 transition-opacity"
                                    >
                                        {uploading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                                        {uploading ? 'Uploading...' : 'Choose Logo'}
                                    </label>
                                    <p className="text-[10px] text-gray-400 mt-1">Recommended size: 200x200px (PNG, SVG, JPG)</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold dark:text-gray-300">Dashboard Theme</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setLocalTheme('light')}
                                    className={`flex-1 p-3 border-2 font-bold transition-all ${localTheme === 'light' ? 'border-spark-orange bg-orange-50 text-black' : 'border-gray-200 text-gray-400'}`}
                                >
                                    Light
                                </button>
                                <button
                                    onClick={() => setLocalTheme('dark')}
                                    className={`flex-1 p-3 border-2 font-bold transition-all ${localTheme === 'dark' ? 'border-spark-purple bg-purple-900 text-white' : 'border-gray-200 text-gray-400'}`}
                                >
                                    Dark
                                </button>
                            </div>
                        </div>
                        <div className="pt-4 border-t-2 border-dashed border-black dark:border-gray-700">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => logActivity(`Manual system test performed by ${user?.name || 'Admin'}`, 'success', user?.name)}
                            >
                                Log Test Activity
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Settings */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="border-b-black dark:border-gray-600">
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <User size={20} /> Profile Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold dark:text-gray-300">Full Name</label>
                            <Input
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold dark:text-gray-300">Email Address</label>
                            <Input
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                type="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold dark:text-gray-300">Role</label>
                            <Input value={profile.role} disabled className="bg-gray-100 dark:bg-gray-700 dark:text-gray-400" />
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="border-b-black dark:border-gray-600">
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <Lock size={20} /> Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold dark:text-gray-300">Current Password</label>
                            <Input
                                type="password"
                                placeholder="•••••••"
                                value={security.currentPassword}
                                onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold dark:text-gray-300">New Password</label>
                            <Input
                                type="password"
                                placeholder="•••••••"
                                value={security.newPassword}
                                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                            />
                        </div>
                        <Button className="w-full mt-2" variant="outline" onClick={handleSave}>Update Password</Button>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="border-b-black dark:border-gray-600">
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <Bell size={20} /> Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                            <span className="text-sm font-bold dark:text-gray-300">Email Alerts</span>
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-spark-orange border-2 border-black"
                                checked={notifications.emailAlerts}
                                onChange={(e) => setNotifications(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                            <span className="text-sm font-bold dark:text-gray-300">New Project Created</span>
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-spark-orange border-2 border-black"
                                checked={notifications.projectCreated}
                                onChange={(e) => setNotifications(prev => ({ ...prev, projectCreated: e.target.checked }))}
                            />
                        </div>
                        <div className="flex items-center justify-between pb-2">
                            <span className="text-sm font-bold dark:text-gray-300">Student Enrollment</span>
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-spark-orange border-2 border-black"
                                checked={notifications.studentEnrollment}
                                onChange={(e) => setNotifications(prev => ({ ...prev, studentEnrollment: e.target.checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
