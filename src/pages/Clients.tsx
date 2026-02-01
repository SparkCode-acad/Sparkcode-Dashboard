import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
}

const Clients = () => {
    const { user } = useAuth();
    const { logActivity } = useNotifications();
    const { showToast, showConfirm } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    // Form State
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', location: '' });

    // Fetch Clients Real-time
    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, "clients"),
            (snapshot) => {
                const clientsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Client[];
                setClients(clientsData);
                setLoading(false);
            },
            (error) => {
                console.error("Failed to fetch clients", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            await addDoc(collection(db, "clients"), newClient);
            setIsModalOpen(false);
            setNewClient({ name: '', email: '', phone: '', location: '' });
            showToast("Client added successfully!");
        } catch (error: any) {
            console.error("Failed to create client", error);
            showToast("Failed to create client", "error");
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold">Clients</h2>
                    <p className="text-gray-500 font-medium">Agency client directory</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>Add Client</Button>
            </div>

            <div className="w-full md:w-1/3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input placeholder="Search clients..." className="pl-10" />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 font-bold text-gray-400">Loading Clients...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map((client) => (
                        <Card key={client.id} className="hover:shadow-neo-lg transition-all group">
                            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-spark-yellow border-2 border-black flex items-center justify-center text-xl font-bold shadow-neo-sm group-hover:scale-110 transition-transform">
                                    {client.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{client.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium">Active Customer</p>
                                </div>

                                <div className="w-full space-y-3 pt-4 border-t-2 border-gray-100">
                                    <div className="flex items-center gap-2 text-sm justify-center">
                                        <Mail size={14} className="text-spark-purple" />
                                        <span>{client.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm justify-center">
                                        <Phone size={14} className="text-spark-orange" />
                                        <span>{client.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm justify-center">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span>{client.location}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full mt-4">
                                    <Button variant="outline" className="flex-1">View Profile</Button>
                                    <Button
                                        variant="outline"
                                        className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-500"
                                        onClick={async () => {
                                            showConfirm("Delete Client", `Are you sure you want to remove ${client.name}?`, async () => {
                                                await deleteDoc(doc(db, "clients", client.id));
                                                await logActivity(`Deleted client ${client.name}`, 'warning', user?.name);
                                                showToast("Client deleted", "warning");
                                            });
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ADD CLIENT MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Client"
            >
                <form onSubmit={handleCreateClient} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold">Client Name</label>
                        <Input
                            required
                            placeholder="e.g. Acme Corp"
                            value={newClient.name}
                            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold">Email</label>
                        <Input
                            required
                            type="email"
                            placeholder="contact@acme.com"
                            value={newClient.email}
                            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold">Phone</label>
                        <Input
                            placeholder="+1 234 567 890"
                            value={newClient.phone}
                            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold">Location</label>
                        <Input
                            placeholder="City, Country"
                            value={newClient.location}
                            onChange={(e) => setNewClient({ ...newClient, location: e.target.value })}
                        />
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={createLoading}>
                        {createLoading ? <Loader2 className="animate-spin" size={18} /> : 'Add Client'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};


export default Clients;
