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

    const handleStatusChange = async (projectId: string, currentStatus: string, direction: 'next' | 'prev') => {
        const currentIndex = columns.findIndex(col => col.id === currentStatus);
        let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (nextIndex >= 0 && nextIndex < columns.length) {
            const nextStatus = columns[nextIndex].id;
            try {
                await fs.updateDoc(fs.doc(db, "projects", projectId), {
                    status: nextStatus
                });
            } catch (error) {
                console.error("Error updating project status:", error);
            }
        }
    };

    const getColumnProjects = (status: string) => projects.filter(p => p.status === status);

    return (
        <div className="space-y-6 pb-20 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white text-black">Project Board</h2>
                    <p className="text-gray-500 font-medium font-bold uppercase tracking-widest text-[10px]">Kanban View</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> New Task
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 min-w-[1000px] h-full">
                    {columns.map((col, colIdx) => (
                        <div key={col.id} className={`flex-1 min-w-[250px] p-4 rounded-xl border-2 border-black dark:border-gray-700 ${col.color} dark:bg-gray-800/20 flex flex-col`}>
                            <div className="flex justify-between items-center mb-4 border-b-2 border-black dark:border-gray-700 pb-2">
                                <h3 className="font-black text-sm uppercase tracking-wider dark:text-gray-300">{col.title}</h3>
                                <Badge variant="secondary" className="bg-black text-white dark:bg-spark-purple">{getColumnProjects(col.id).length}</Badge>
                            </div>

                            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                                {getColumnProjects(col.id).length === 0 ? (
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Empty</p>
                                    </div>
                                ) : (
                                    getColumnProjects(col.id).map(project => (
                                        <div
                                            key={project.id}
                                            className="bg-white dark:bg-gray-900 p-4 border-2 border-black dark:border-gray-700 shadow-neo-sm hover:translate-y-[-2px] hover:shadow-neo-lg transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-spark-purple bg-spark-purple/10 px-2 py-0.5 border border-spark-purple/20">{project.client}</span>
                                            </div>
                                            <h4 className="font-bold dark:text-white mb-3">{project.name}</h4>

                                            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-tighter mb-4">
                                                <span>📅 {project.deadline}</span>
                                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 border border-black dark:border-gray-700">{project.budget}</span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-3 border-t-2 border-dashed border-gray-100 dark:border-gray-800">
                                                {colIdx > 0 && (
                                                    <button
                                                        onClick={() => handleStatusChange(project.id, project.status, 'prev')}
                                                        className="flex-1 py-1 text-[10px] font-black uppercase border-2 border-black dark:border-gray-700 hover:bg-black hover:text-white dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        ← Back
                                                    </button>
                                                )}
                                                {colIdx < columns.length - 1 && (
                                                    <button
                                                        onClick={() => handleStatusChange(project.id, project.status, 'next')}
                                                        className="flex-1 py-1 text-[10px] font-black uppercase border-2 border-black dark:border-gray-700 bg-spark-orange hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                                    >
                                                        Move →
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
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
