import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Search, Plus, BookOpen, Users, GraduationCap, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

// Tabs component for internal navigation
const Tabs = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => (
    <div className="flex space-x-2 border-b-2 border-black w-full mb-6">
        {['Dashboard', 'Students', 'Courses'].map((tab) => (
            <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-4 py-2 font-bold text-sm border-t-2 border-l-2 border-r-2 border-black -mb-0.5 transition-all ${activeTab === tab
                    ? 'bg-spark-orange text-black translate-y-[2px]'
                    : 'bg-white text-gray-500 hover:bg-gray-100'
                    }`}
            >
                {tab}
            </button>
        ))}
    </div>
);

interface Student {
    id: string;
    name: string;
    course: string;
    status: string;
    progress: number;
    payment: string;
}

interface Course {
    id: string;
    title: string;
    students: number;
    duration: string;
    price: string;
    instructor: string;
}

const Academy = () => {
    const { user } = useAuth();
    const { logActivity } = useNotifications();
    const { showToast, showConfirm } = useToast();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isStudentEditModalOpen, setIsStudentEditModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    // Form Data
    const [newStudent, setNewStudent] = useState({ name: '', course: '', payment: 'Pending', status: 'Active', progress: 0 });
    const [newCourse, setNewCourse] = useState({ title: '', instructor: '', duration: '', price: '', students: 0 });

    // Sync Tab with URL
    useEffect(() => {
        if (location.pathname.includes('students')) setActiveTab('Students');
        else if (location.pathname.includes('courses')) setActiveTab('Courses');
        else if (location.pathname === '/academy') setActiveTab('Dashboard');
    }, [location.pathname]);

    // Fetch Data Real-time
    useEffect(() => {
        setLoading(true);
        const unsubStudents = onSnapshot(collection(db, "students"),
            (snap) => {
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Student[];
                setStudents(data);
            },
            (error) => {
                console.error("Error fetching students:", error);
                setLoading(false);
            }
        );
        const unsubCourses = onSnapshot(collection(db, "courses"),
            (snap) => {
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Course[];
                setCourses(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching courses:", error);
                setLoading(false);
            }
        );

        return () => {
            unsubStudents();
            unsubCourses();
        };
    }, []);

    const handleEnrollStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);
        try {
            await addDoc(collection(db, "students"), {
                ...newStudent,
                createdAt: serverTimestamp()
            });
            await logActivity(`Enrolled student ${newStudent.name} in ${newStudent.course}`, 'success', user?.name);
            setIsStudentModalOpen(false);
            showToast("Student enrolled successfully!");
            setNewStudent({ name: '', course: '', payment: 'Pending', status: 'Active', progress: 0 });
        } catch (error: any) {
            console.error("Failed to enroll student", error);
            setError(error.message || "Failed to enroll student. Please try again.");
            logActivity(`Failed to enroll student: ${error.message}`, 'error', user?.name);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await addDoc(collection(db, "courses"), {
                ...newCourse,
                createdAt: serverTimestamp()
            });
            await logActivity(`Created new course: ${newCourse.title}`, 'success', user?.name);
            setIsCourseModalOpen(false);
            showToast("Course created successfully!");
            setNewCourse({ title: '', instructor: '', duration: '', price: '', students: 0 });
        } catch (error: any) {
            console.error("Failed to create course", error);
            setError(error.message || "Failed to create course.");
            logActivity(`Failed to create course: ${error.message}`, 'error', user?.name);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCourse) return;
        setActionLoading(true);
        setError(null);
        try {
            const { id, ...data } = editingCourse;
            await updateDoc(doc(db, "courses", id), data);
            await logActivity(`Updated course: ${editingCourse.title}`, 'info', user?.name);
            setIsEditModalOpen(false);
            showToast("Course updated!");
            setEditingCourse(null);
        } catch (error: any) {
            console.error("Failed to update course", error);
            setError(error.message || "Failed to update course.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;
        setActionLoading(true);
        setError(null);
        try {
            const { id, ...data } = editingStudent;
            await updateDoc(doc(db, "students", id), data);
            await logActivity(`Updated progress/status for student ${editingStudent.name}`, 'info', user?.name);
            setIsStudentEditModalOpen(false);
            showToast("Student updated!");
            setEditingStudent(null);
        } catch (error: any) {
            console.error("Failed to update student", error);
            setError(error.message || "Failed to update student.");
            showToast("Failed to update student", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteStudent = async (id: string) => {
        showConfirm("Remove Student", "Are you sure you want to delete this student record? This cannot be undone.", async () => {
            await deleteDoc(doc(db, "students", id));
            await logActivity(`Removed student from records`, 'warning', user?.name);
            showToast("Student record deleted", "warning");
        });
    };

    const handleActionClick = () => {
        if (activeTab === 'Students' || activeTab === 'Dashboard') setIsStudentModalOpen(true);
        else if (activeTab === 'Courses') setIsCourseModalOpen(true);
    };

    return (
        <div className="space-y-6 overflow-y-auto pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold">Sparkcode Academy</h2>
                    <p className="text-gray-500 font-medium">Manage students and curriculum</p>
                </div>
                <Button onClick={handleActionClick}>
                    <Plus size={18} className="mr-2" />
                    {activeTab === 'Students' ? 'Enroll Student' : activeTab === 'Courses' ? 'New Course' : 'Action'}
                </Button>
            </div>

            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

            {loading ? (
                <div className="text-center py-10 font-bold text-gray-400">Loading Academy Data...</div>
            ) : (
                <>
                    {/* DASHBOARD VIEW */}
                    {activeTab === 'Dashboard' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="bg-spark-blue">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-black">
                                        <CardTitle className="text-sm font-bold uppercase">Total Students</CardTitle>
                                        <Users size={20} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{students.length}</div>
                                        <p className="text-xs font-bold opacity-70">Enrolled Students</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-spark-yellow">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-black">
                                        <CardTitle className="text-sm font-bold uppercase">Active Courses</CardTitle>
                                        <BookOpen size={20} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{courses.length}</div>
                                        <p className="text-xs font-bold opacity-70">Available Courses</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-green-300">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-black">
                                        <CardTitle className="text-sm font-bold uppercase">Graduates</CardTitle>
                                        <GraduationCap size={20} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{students.filter(s => s.status === 'Graduated').length}</div>
                                        <p className="text-xs font-bold opacity-70">Alumni Network</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* STUDENTS VIEW */}
                    {activeTab === 'Students' && (
                        <div className="space-y-4">
                            <div className="flex gap-4 mb-4">
                                <div className="relative w-full md:w-1/3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input placeholder="Search students..." className="pl-10" />
                                </div>
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden lg:block bg-white border-2 border-black shadow-neo overflow-x-auto">
                                <table className="w-full text-left bg-white">
                                    <thead className="bg-gray-50 border-b-2 border-black">
                                        <tr>
                                            <th className="p-4 font-bold border-r border-black">Name</th>
                                            <th className="p-4 font-bold border-r border-black">Course</th>
                                            <th className="p-4 font-bold border-r border-black">Status</th>
                                            <th className="p-4 font-bold border-r border-black">Progress</th>
                                            <th className="p-4 font-bold border-r border-black">Payment</th>
                                            <th className="p-4 font-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr key={student.id} className="border-b border-black last:border-0 hover:bg-gray-50 group">
                                                <td className="p-4 font-bold border-r border-black">{student.name}</td>
                                                <td className="p-4 border-r border-black">{student.course}</td>
                                                <td className="p-4 border-r border-black">
                                                    <Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>
                                                        {student.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 border-r border-black">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-gray-200 border border-black rounded-full overflow-hidden">
                                                            <div className="h-full bg-spark-purple" style={{ width: `${student.progress}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-black">{student.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 border-r border-black">
                                                    <Badge className={cn(
                                                        "font-black uppercase",
                                                        student.payment === 'Paid' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'
                                                    )}>
                                                        {student.payment}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 font-mono font-bold">
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => {
                                                                setEditingStudent(student);
                                                                setIsStudentEditModalOpen(true);
                                                            }}
                                                            className="flex items-center justify-center p-2 bg-spark-blue/10 border-2 border-spark-blue text-spark-blue hover:bg-spark-blue hover:text-white transition-all shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                                            title="Edit Student"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {user?.role === 'admin' && (
                                                            <button
                                                                onClick={() => handleDeleteStudent(student.id.toString())}
                                                                className="flex items-center justify-center p-2 bg-red-50 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                                                title="Delete Student"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="lg:hidden grid grid-cols-1 gap-4">
                                {students.map((student) => (
                                    <Card key={student.id} className="border-2 border-black shadow-neo-sm overflow-hidden bg-white">
                                        <div className="p-4 border-b-2 border-black bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-black text-lg uppercase tracking-tight">{student.name}</h3>
                                                <p className="text-xs font-bold text-gray-500 uppercase">{student.course}</p>
                                            </div>
                                            <Badge variant={student.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">
                                                {student.status}
                                            </Badge>
                                        </div>
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                                                    <span>Course Progress</span>
                                                    <span>{student.progress}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-gray-200 border-2 border-black rounded-none overflow-hidden p-[1px]">
                                                    <div
                                                        className="h-full bg-spark-purple transition-all duration-500"
                                                        style={{ width: `${student.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-gray-400">Payment</span>
                                                    <span className={cn(
                                                        "font-black text-sm uppercase",
                                                        student.payment === 'Paid' ? 'text-green-600' : 'text-red-500 animate-pulse'
                                                    )}>
                                                        {student.payment}
                                                    </span>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setEditingStudent(student);
                                                            setIsStudentEditModalOpen(true);
                                                        }}
                                                        className="flex items-center justify-center p-3 bg-spark-blue border-2 border-black text-white shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                                        title="Edit Student"
                                                    >
                                                        <Edit2 size={20} />
                                                        <span className="ml-2 font-black text-xs uppercase">Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStudent(student.id.toString())}
                                                        className="flex items-center justify-center p-3 bg-red-500 border-2 border-black text-white shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                                        title="Delete Student"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* COURSES VIEW */}
                    {activeTab === 'Courses' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course, index) => {
                                const colors = ['bg-spark-purple', 'bg-spark-orange', 'bg-spark-blue', 'bg-spark-yellow', 'bg-spark-green'];
                                const cardColor = colors[index % colors.length];

                                return (
                                    <Card key={course.id} className="hover:shadow-neo-lg transition-all group overflow-hidden border-2 border-black">
                                        <div className={cn("h-32 border-b-2 border-black flex items-center justify-center p-6 relative overflow-hidden", cardColor)}>
                                            <BookOpen size={64} className="text-white opacity-20 absolute -right-4 -bottom-4 transform rotate-12 group-hover:scale-110 transition-transform" />
                                            <h3 className="text-2xl font-black text-white relative z-10 text-center uppercase tracking-tight shadow-sm">{course.title}</h3>
                                        </div>
                                        <CardContent className="space-y-4 pt-6">
                                            <div className="flex justify-between items-center text-sm font-bold border-b border-gray-100 pb-2">
                                                <span className="text-gray-500">Instructor</span>
                                                <span>{course.instructor}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-bold border-b border-gray-100 pb-2">
                                                <span className="text-gray-500">Duration</span>
                                                <span>{course.duration}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-bold pb-2">
                                                <span className="text-gray-500">Students</span>
                                                <Badge variant="secondary" className="bg-gray-100">
                                                    {students.filter(s => s.course === course.title).length} Enrolled
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-xl font-bold bg-spark-yellow px-2 border border-black shadow-neo-sm transform -rotate-2">
                                                    {course.price}
                                                </span>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" className="text-red-500 border-red-200" onClick={() => {
                                                        showConfirm("Delete Course", `Are you sure you want to delete "${course.title}"?`, async () => {
                                                            await deleteDoc(doc(db, "courses", course.id));
                                                            showToast("Course deleted", "warning");
                                                        });
                                                    }}>
                                                        Delete
                                                    </Button>
                                                    <Button size="sm" variant="default" onClick={() => {
                                                        setEditingCourse(course);
                                                        setIsEditModalOpen(true);
                                                    }}>
                                                        Manage
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ENROLL STUDENT MODAL */}
            <Modal
                isOpen={isStudentModalOpen}
                onClose={() => setIsStudentModalOpen(false)}
                title="Enroll New Student"
            >
                <form onSubmit={handleEnrollStudent} className="space-y-4">
                    {error && (
                        <div className="bg-red-100 border-2 border-red-500 p-3 rounded-none mb-4">
                            <p className="text-red-700 font-black text-xs uppercase tracking-widest">{error}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-bold">Student Name</label>
                        <Input
                            required
                            placeholder="e.g. John Doe"
                            value={newStudent.name}
                            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold">Assign Course</label>
                        <select
                            className="flex h-10 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold shadow-neo-sm focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none"
                            value={newStudent.course}
                            onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
                            required
                        >
                            <option value="">Select a course...</option>
                            {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold">Student Status</label>
                        <select
                            className="flex h-10 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold shadow-neo-sm focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none"
                            value={newStudent.status}
                            onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Graduated">Graduated</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold">Payment Status</label>
                        <select
                            className="flex h-10 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold shadow-neo-sm focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none"
                            value={newStudent.payment}
                            onChange={(e) => setNewStudent({ ...newStudent, payment: e.target.value })}
                        >
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={actionLoading}>
                        {actionLoading ? "Enrolling..." : "Enroll Student"}
                    </Button>
                </form>
            </Modal>

            {/* CREATE COURSE MODAL */}
            <Modal
                isOpen={isCourseModalOpen}
                onClose={() => setIsCourseModalOpen(false)}
                title="Create New Course"
            >
                <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold">Course Title</label>
                        <Input
                            required
                            placeholder="e.g. Advanced Python"
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold">Instructor</label>
                        <Input
                            required
                            placeholder="e.g. Jane Smith"
                            value={newCourse.instructor}
                            onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Duration</label>
                            <Input
                                placeholder="e.g. 8 Weeks"
                                value={newCourse.duration}
                                onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Price</label>
                            <Input
                                placeholder="e.g. $499"
                                value={newCourse.price}
                                onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={actionLoading}>
                        {actionLoading ? "Creating..." : "Create Course"}
                    </Button>
                </form>
            </Modal>
            {/* EDIT COURSE MODAL */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Course Details"
            >
                {editingCourse && (
                    <form onSubmit={handleUpdateCourse} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Course Title</label>
                            <Input
                                required
                                value={editingCourse.title}
                                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Instructor</label>
                            <Input
                                required
                                value={editingCourse.instructor}
                                onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold">Duration</label>
                                <Input
                                    value={editingCourse.duration}
                                    onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold">Price</label>
                                <Input
                                    value={editingCourse.price}
                                    onChange={(e) => setEditingCourse({ ...editingCourse, price: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full mt-4" disabled={actionLoading}>
                            {actionLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                )}
            </Modal>

            {/* EDIT STUDENT MODAL */}
            <Modal
                isOpen={isStudentEditModalOpen}
                onClose={() => setIsStudentEditModalOpen(false)}
                title="Update Student Progress"
            >
                {editingStudent && (
                    <form onSubmit={handleUpdateStudent} className="space-y-4">
                        {error && (
                            <div className="bg-red-100 border-2 border-red-500 p-3 rounded-none mb-4">
                                <p className="text-red-700 font-black text-xs uppercase tracking-widest">{error}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Student Name</label>
                            <Input
                                disabled
                                value={editingStudent.name}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Progress ({editingStudent.progress}%)</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-spark-orange"
                                value={editingStudent.progress}
                                onChange={(e) => setEditingStudent({ ...editingStudent, progress: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Status</label>
                            <select
                                className="flex h-10 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-bold shadow-neo-sm"
                                value={editingStudent.status}
                                onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Graduated">Graduated</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Course</label>
                            <select
                                className="flex h-10 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-bold shadow-neo-sm"
                                value={editingStudent.course}
                                onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })}
                            >
                                {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Payment Status</label>
                            <select
                                className="flex h-10 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-bold shadow-neo-sm"
                                value={editingStudent.payment}
                                onChange={(e) => setEditingStudent({ ...editingStudent, payment: e.target.value })}
                            >
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                        <Button type="submit" className="w-full mt-4" disabled={actionLoading}>
                            {actionLoading ? "Updating..." : "Save Student Progress"}
                        </Button>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Academy;
