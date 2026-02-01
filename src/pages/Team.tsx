import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Shield, Trash2, Loader2, UserPlus, Pencil } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import * as fs from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    status: string;
    email?: string;
}

const Team = () => {
    const { user } = useAuth();
    const { logActivity } = useNotifications();
    const { showToast } = useToast();
    const { showConfirm } = useToast();

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [memberForm, setMemberForm] = useState({ name: '', role: '', status: 'Active', email: '' });

    useEffect(() => {
        const unsubscribe = fs.onSnapshot(fs.collection(db, "team"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TeamMember[];
            setMembers(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (editingId) {
                // Update existing member
                await fs.updateDoc(fs.doc(db, "team", editingId), {
                    ...memberForm,
                    updatedAt: fs.serverTimestamp()
                });
                await logActivity(`Updated team member: ${memberForm.name}`, 'info', user?.name);
                showToast("Team member updated!");
            } else {
                // Add new member
                await fs.addDoc(fs.collection(db, "team"), {
                    ...memberForm,
                    createdAt: fs.serverTimestamp()
                });
                await logActivity(`Added new team member: ${memberForm.name}`, 'success', user?.name);
                showToast("Team member added!");
            }
            setIsModalOpen(false);
            setEditingId(null);
            setMemberForm({ name: '', role: '', status: 'Active', email: '' });
        } catch (error: any) {
            console.error("Error saving member:", error);
            showToast("Failed to save member", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditClick = (member: TeamMember) => {
        setEditingId(member.id);
        setMemberForm({
            name: member.name,
            role: member.role,
            status: member.status,
            email: member.email || ''
        });
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setEditingId(null);
        setMemberForm({ name: '', role: '', status: 'Active', email: '' });
        setIsModalOpen(true);
    };

    const handleDeleteMember = async (id: string, name: string) => {
        showConfirm("Remove Team Member", `Are you sure you want to remove ${name} from the team?`, async () => {
            try {
                await fs.deleteDoc(fs.doc(db, "team", id));
                await logActivity(`Removed team member: ${name}`, 'warning', user?.name);
                showToast("Team member removed", "warning");
            } catch (error) {
                console.error("Error deleting member:", error);
            }
        });
    };

    const handleSeedFounders = async () => {
        showConfirm("Initialize Founders", "This will add Jafar, Zayd, and Muhsin as the founding team. Continue?", async () => {
            setActionLoading(true);
            try {
                const founders = [
                    { name: 'Jafar Abass', role: 'Founder - Graphic Designer', status: 'Active', email: 'jafar@sparkcode.com' },
                    { name: 'Zayd Tahir', role: 'Co founder - Full stack developer', status: 'Active', email: 'zayd@sparkcode.com' },
                    { name: 'Muhsin Raheem', role: 'Co founder - Product Designer', status: 'Active', email: 'muhsin@sparkcode.com' }
                ];

                for (const founder of founders) {
                    await fs.addDoc(fs.collection(db, "team"), {
                        ...founder,
                        createdAt: fs.serverTimestamp()
                    });
                }
                showToast("Founding team initialized!");
                await logActivity("Initialized founding team members", "success", user?.name);
            } catch (error: any) {
                console.error("Failed to seed team", error);
                showToast("Failed to initialize founders", "error");
            } finally {
                setActionLoading(false);
            }
        });
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center text-black dark:text-white">
                <div>
                    <h2 className="text-3xl font-bold">Founding Team</h2>
                    <p className="text-gray-500 font-medium dark:text-gray-400">Core members and founders of Sparkcode</p>
                </div>
                <div className="flex gap-2">
                    {members.length === 0 && (
                        <Button variant="outline" onClick={handleSeedFounders} disabled={actionLoading}>
                            Initialize Founders
                        </Button>
                    )}
                    <Button onClick={handleAddClick}>
                        <UserPlus size={18} className="mr-2" /> Add Member
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-spark-orange" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map(member => (
                        <Card key={member.id} className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-neo transition-all border-2 border-black dark:border-gray-700">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-spark-purple/10 rounded-full flex items-center justify-center text-spark-purple font-black text-xl border-2 border-spark-purple/20">
                                        {member.name.charAt(0)}
                                    </div>
                                    <span className={cn(
                                        "px-2 py-0.5 text-[10px] font-black uppercase border-2 border-black dark:border-gray-700 rounded",
                                        member.status === 'Active' ? "bg-green-100 dark:bg-green-900/30 text-green-700" : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                                    )}>
                                        {member.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-black dark:text-white mb-1">{member.name}</h3>
                                <p className="text-sm font-bold text-spark-orange mb-4 italic">{member.role}</p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Mail size={14} /> {member.email || "No email provided"}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Shield size={14} /> Team Access
                                    </div>
                                </div>

                                <div className="pt-4 border-t-2 border-dashed border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                                    <button
                                        onClick={() => handleEditClick(member)}
                                        className="p-2 text-gray-400 hover:text-spark-orange transition-colors"
                                        title="Edit Member"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMember(member.id, member.name)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Remove Member"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Team Member" : "Add New Team Member"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold dark:text-gray-300">Full Name</label>
                        <Input
                            required
                            value={memberForm.name}
                            onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                            placeholder="e.g. Jafar Abass"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold dark:text-gray-300">Role/Title</label>
                        <Input
                            required
                            value={memberForm.role}
                            onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                            placeholder="e.g. Founder - Graphic Designer"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold dark:text-gray-300">Email</label>
                        <Input
                            type="email"
                            value={memberForm.email}
                            onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                            placeholder="email@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold dark:text-gray-300">Status</label>
                        <select
                            className="w-full p-2 border-2 border-black dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white"
                            value={memberForm.status}
                            onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                    </div>
                    <Button type="submit" className="w-full" disabled={actionLoading}>
                        {actionLoading ? 'Saving...' : (editingId ? 'Update Member' : 'Add Member')}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default Team;
