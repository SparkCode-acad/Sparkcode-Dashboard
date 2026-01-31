import { useState, useEffect } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import * as fs from 'firebase/firestore';
import { db } from '../firebase';

interface KanbanProject {
    id: string;
    name: string;
    client: string;
    status: "To Do" | "In Progress" | "Review" | "Done";
    deadline: string;
    budget: string;
}

const Kanban = () => {
    const [projects, setProjects] = useState<KanbanProject[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = fs.onSnapshot(fs.collection(db, "projects"), (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as KanbanProject[];
            setProjects(projectsData);
        });
        return () => unsubscribe();
    }, []);

    const columns = [
        { id: "To Do", title: "To Do", color: "bg-gray-100" },
        { id: "In Progress", title: "In Progress", color: "bg-blue-50" },
        { id: "Review", title: "Review", color: "bg-yellow-50" },
        { id: "Done", title: "Done", color: "bg-green-50" }
    ];

    const getColumnProjects = (status: string) => projects.filter(p => p.status === status);

    return (
        <div className="space-y-6 pb-20 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold">Project Board</h2>
                    <p className="text-gray-500 font-medium">Kanban View</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> New Task
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 min-w-[1000px] h-full">
                    {columns.map(col => (
                        <div key={col.id} className={`flex-1 min-w-[250px] p-4 rounded-xl border-2 border-black ${col.color} flex flex-col`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg uppercase">{col.title}</h3>
                                <Badge variant="secondary">{getColumnProjects(col.id).length}</Badge>
                            </div>

                            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                                {getColumnProjects(col.id).map(project => (
                                    <div
                                        key={project.id}
                                        className="bg-white p-4 border-2 border-black shadow-neo-sm hover:translate-y-[-2px] transition-transform cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-spark-purple">{project.client}</span>
                                        </div>
                                        <h4 className="font-bold mb-2">{project.name}</h4>
                                        <div className="flex justify-between items-center text-xs text-gray-500 font-bold">
                                            <span>{project.deadline}</span>
                                            <span>{project.budget}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Task"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">Use the main Projects page to create full projects. Quick task creation coming soon.</p>
                    <Button onClick={() => setIsModalOpen(false)} className="w-full">Got it</Button>
                </div>
            </Modal>
        </div>
    );
};

export default Kanban;
