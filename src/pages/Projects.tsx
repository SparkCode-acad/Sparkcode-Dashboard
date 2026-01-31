import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Search, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface Project {
    id: string;
    name: string;
    client: string;
    status: string;
    deadline: string;
    budget: string;
    team: number;
}

const Projects = () => {
    const { user } = useAuth();
    const { logActivity } = useNotifications();
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [createLoading, setCreateLoading] = useState(false);

    // Task System State
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [projectTasks, setProjectTasks] = useState<any[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [tasksLoading, setTasksLoading] = useState(false);

    // Form State
    const [newProject, setNewProject] = useState({ name: '', client: '', budget: '', deadline: '', status: 'In Progress', team: 1 });

    // Fetch Projects Real-time
    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, "projects"),
            (snapshot) => {
                const projectsData = snapshot?.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Project[];
                setProjects(projectsData || []);
                setLoading(false);
            },
            (error) => {
                console.error("Projects Fetch Error:", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    // Fetch Tasks for Selected Project
    useEffect(() => {
        if (!selectedProject?.id) return;

        setTasksLoading(true);
        const unsubscribe = onSnapshot(collection(db, "projects", selectedProject.id, "tasks"),
            (snapshot) => {
                const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                tasks.sort((a: any, b: any) => b.createdAt - a.createdAt); // Newest first
                setProjectTasks(tasks);
                setTasksLoading(false);
            },
            (error) => {
                console.error("Tasks Fetch Error:", error);
                setTasksLoading(false);
            }
        );

        return () => unsubscribe();
    }, [selectedProject]);

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            await addDoc(collection(db, "projects"), newProject);
            await logActivity(`Started new project: ${newProject.name}`, 'success', user?.name);
            setIsModalOpen(false);
            setNewProject({ name: '', client: '', budget: '', deadline: '', status: 'In Progress', team: 1 });
        } catch (error: any) {
            console.error("Failed to create project", error);
            alert("Error creating project: " + (error.message || "Unknown error"));
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDelete = async (id: string | undefined) => {
        if (!id) return;
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteDoc(doc(db, "projects", id));
            await logActivity(`Archived project record`, 'error', user?.name);
        } catch (error) {
            console.error("Error deleting project: ", error);
        }
    };

    const handleOpenTasks = (project: Project) => {
        setSelectedProject(project);
        setIsTaskModalOpen(true);
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !selectedProject?.id) return;

        try {
            await addDoc(collection(db, "projects", selectedProject.id, "tasks"), {
                title: newTaskTitle,
                completed: false,
                createdAt: Date.now()
            });
            setNewTaskTitle('');
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    // I need to update the imports to include `updateDoc` for full functionality, 
    // but for this block I will focus on the component logic. 
    // I will add `handleDeleteTask` instead of toggle for now to keep it simple as per prompt "save it to a 'tasks' sub-collection".

    const handleUpdateStatus = async (e: React.MouseEvent, id: string, currentStatus: string) => {
        e.stopPropagation();
        const newStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
        try {
            await updateDoc(doc(db, "projects", id), {
                status: newStatus
            });
            await logActivity(`Updated project status to ${newStatus}`, 'info', user?.name);
        } catch (error) {
            console.error("Error updating project status:", error);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!selectedProject?.id) return;
        try {
            await deleteDoc(doc(db, "projects", selectedProject.id, "tasks", taskId));
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    }

    const filteredProjects = projects?.filter(p =>
        p?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p?.client?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white">Projects</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Manage agency work and timelines</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> New Project
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 border-2 border-black dark:border-gray-700 shadow-neo-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search projects..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center text-gray-400">
                    <Loader2 className="animate-spin mr-2" /> Loading Projects...
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-10 bg-gray-50 dark:bg-gray-900">
                    <AlertCircle className="text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">No Projects Found</p>
                    <p className="text-gray-400 text-sm">Create a new project to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Card
                            key={project.id}
                            onClick={() => handleOpenTasks(project)}
                            className="cursor-pointer hover:shadow-neo-lg transition-all group relative dark:bg-gray-800 dark:border-gray-700"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <Trash2 size={16} />
                            </button>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="mb-2 bg-spark-yellow text-black border-black">
                                        {project?.client || 'No Client'}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl dark:text-white">{project?.name || 'Untitled'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center mb-4 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    <span>Deadline: {project?.deadline || 'N/A'}</span>
                                    <span>{project?.budget || '$0'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Badge
                                        variant={project?.status === 'Completed' ? 'default' : 'secondary'}
                                        className="cursor-pointer hover:scale-105 transition-transform"
                                        onClick={(e) => handleUpdateStatus(e, project.id, project.status)}
                                    >
                                        {project?.status || 'In Progress'}
                                    </Badge>
                                    <div className="flex -space-x-2">
                                        {[...Array(Math.min(project?.team || 1, 3))].map((_, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-black">
                                                U{i + 1}
                                            </div>
                                        ))}
                                        {(project?.team || 0) > 3 && (
                                            <div className="w-8 h-8 rounded-full bg-black text-white border-2 border-white flex items-center justify-center text-xs font-bold">
                                                +{project.team - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* CREATE PROJECT MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Project"
            >
                <form onSubmit={handleAddProject} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold">Project Name</label>
                        <Input
                            required
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                            placeholder="e.g. Website Redesign"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold">Client</label>
                        <Input
                            required
                            value={newProject.client}
                            onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                            placeholder="e.g. TechCorp"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold">Deadline</label>
                            <Input
                                type="date"
                                required
                                value={newProject.deadline}
                                onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold">Budget</label>
                            <Input
                                value={newProject.budget}
                                onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                                placeholder="e.g. $5000"
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={createLoading}>
                        {createLoading ? <Loader2 className="animate-spin" size={18} /> : 'Create Project'}
                    </Button>
                </form>
            </Modal>

            {/* MANAGE TASKS MODAL */}
            {selectedProject && (
                <Modal
                    isOpen={isTaskModalOpen}
                    onClose={() => setIsTaskModalOpen(false)}
                    title={`Tasks: ${selectedProject.name}`}
                >
                    <div className="space-y-4">
                        {/* Add Task Form */}
                        <form onSubmit={handleAddTask} className="flex gap-2">
                            <Input
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Type a task and hit Enter..."
                                className="flex-1"
                                autoFocus
                            />
                            <Button type="submit" size="sm" variant="outline">
                                <Plus size={18} />
                            </Button>
                        </form>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {tasksLoading ? (
                                <div className="text-center py-4 text-gray-400">Loading tasks...</div>
                            ) : projectTasks.length === 0 ? (
                                <div className="text-center py-4 text-gray-400 text-sm">No tasks yet. Add one above!</div>
                            ) : (
                                projectTasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg group">
                                        <div className="flex items-center gap-2">
                                            {/* We can actally implement toggle later or just show title */}
                                            <div className="w-2 h-2 rounded-full bg-spark-orange"></div>
                                            <span className="text-sm font-medium">{task.title}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Projects;
