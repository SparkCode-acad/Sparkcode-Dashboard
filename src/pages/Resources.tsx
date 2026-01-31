import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, Upload, Trash2, Folder, Filter, Search, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../lib/utils';

interface ResourceFile {
    id: string;
    name: string;
    size: string;
    type: string;
    date: string;
    category: string;
}

const Resources = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Mock files - storage logic would go here
    const [files, setFiles] = useState<ResourceFile[]>([
        { id: '1', name: 'branding_guide.pdf', size: '2.4 MB', type: 'PDF', date: '2024-01-20', category: 'Design' },
        { id: '2', name: 'q1_report_final.xlsx', size: '1.1 MB', type: 'xlsx', date: '2024-01-15', category: 'Finance' },
        { id: '3', name: 'student_agreement_v2.docx', size: '450 KB', type: 'DOCX', date: '2024-01-10', category: 'Legal' },
        { id: '4', name: 'hero_image_backup.png', size: '8.2 MB', type: 'PNG', date: '2023-12-25', category: 'Design' },
    ]);

    const onDrop = (acceptedFiles: File[]) => {
        // Here we would upload to Firebase Storage
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
            date: new Date().toISOString().split('T')[0],
            category: 'Uncategorized'
        } as ResourceFile));
        setFiles(prev => [...newFiles, ...prev]);
        alert(`Successfully uploaded ${acceptedFiles.length} files (Simulation)`);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const filteredFiles = files.filter(f =>
        (selectedCategory === 'All' || f.category === selectedCategory) &&
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = ['All', 'Design', 'Finance', 'Legal', 'Marketing'];

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white">Resources Hub</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Manage agency assets and documents</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Folder className="mr-2" size={18} /> New Folder</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Filter */}
                <div className="space-y-4">
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 dark:text-white">
                                <Filter size={14} /> Categories
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 space-y-1">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "w-full text-left px-4 py-2 text-sm font-bold rounded-md transition-all",
                                        selectedCategory === cat
                                            ? "bg-black text-white dark:bg-spark-purple"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-spark-yellow border-2 border-black shadow-neo-sm">
                        <CardContent className="p-6">
                            <h4 className="font-black text-sm uppercase mb-2">Storage Status</h4>
                            <div className="h-4 w-full bg-white border-2 border-black rounded-full overflow-hidden">
                                <div className="h-full bg-black w-[45%]" />
                            </div>
                            <p className="text-[10px] font-bold mt-2 text-black uppercase tracking-tighter">4.5 GB OF 10 GB USED</p>
                        </CardContent>
                    </Card>
                </div>

                {/* File List & Upload */}
                <div className="lg:col-span-3 space-y-6">
                    <div {...getRootProps()} className={cn(
                        "p-10 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer",
                        isDragActive ? "border-spark-orange bg-spark-orange/10" : "border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-gray-500 bg-white dark:bg-gray-900"
                    )}>
                        <input {...getInputProps()} />
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 border-2 border-black dark:border-gray-700">
                            <Upload className="text-black dark:text-white" size={32} />
                        </div>
                        <h3 className="text-xl font-black dark:text-white">Drop files here or click to upload</h3>
                        <p className="text-gray-500 font-bold mt-1 uppercase text-xs tracking-widest">Supports PDF, JPG, PNG, DOCX, XLSX (MAX 50MB)</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 border-2 border-black dark:border-gray-700 shadow-neo-sm">
                        <Search className="text-gray-400" size={20} />
                        <input
                            placeholder="Search documents..."
                            className="bg-transparent border-none outline-none flex-1 font-bold dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredFiles.map(file => (
                            <div key={file.id} className="group p-4 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-700 shadow-neo-sm hover:shadow-neo-lg hover:-translate-y-1 transition-all flex items-start gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg group-hover:border-spark-orange transition-colors">
                                    <FileText className="text-gray-400" size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm truncate dark:text-white">{file.name}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">{file.size}</span>
                                        <span className="text-[10px] font-black tracking-widest uppercase bg-spark-blue/10 text-spark-blue px-2 rounded">{file.category}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 font-mono">{file.date}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-black dark:hover:text-white"><Download size={16} /></button>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Resources;
