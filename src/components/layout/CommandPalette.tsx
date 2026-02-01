import { useState, useEffect, useRef } from 'react';
import { Search, Command, X, Briefcase, Users, Settings, Bell, DollarSign, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCommand } from '../../context/CommandContext';

interface CommandItem {
    id: string;
    name: string;
    icon: any;
    path: string;
    section: string;
}

export function CommandPalette() {
    const { isOpen, setIsOpen, toggle } = useCommand();
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const commands: CommandItem[] = [
        { id: '1', name: 'Dashboard', icon: Home, path: '/', section: 'Navigation' },
        { id: '2', name: 'Projects', icon: Briefcase, path: '/projects', section: 'Navigation' },
        { id: '3', name: 'Students', icon: Users, path: '/academy/students', section: 'Navigation' },
        { id: 'team', name: 'Team', icon: Users, path: '/team', section: 'Navigation' },
        { id: '4', name: 'Finance', icon: DollarSign, path: '/finance', section: 'Navigation' },
        { id: '5', name: 'Notifications', icon: Bell, path: '/notifications', section: 'Navigation' },
        { id: '6', name: 'Settings', icon: Settings, path: '/settings', section: 'Navigation' },
    ];

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggle();
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isOpen]);

    const filteredItems = query === ''
        ? commands
        : commands.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

    const handleSelect = (path: string) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 shadow-neo-lg rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center px-4 py-3 border-b-2 border-dashed border-gray-100 dark:border-gray-700">
                    <Search className="mr-3 h-5 w-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        className="flex-1 bg-transparent border-none outline-none text-lg font-bold dark:text-white placeholder:text-gray-400"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-black dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-1.5 font-mono text-[10px] font-bold text-gray-500 opacity-100">
                            ESC
                        </kbd>
                        <button onClick={() => setIsOpen(false)}>
                            <X size={20} className="text-gray-400 hover:text-black dark:hover:text-white" />
                        </button>
                    </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-2">
                    {filteredItems.length === 0 ? (
                        <div className="py-14 text-center">
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-2">
                            <div className="px-2 pt-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Commands</p>
                            </div>
                            {filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item.path)}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-transparent hover:border-black hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
                                >
                                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 group-hover:bg-black group-hover:text-white transition-colors">
                                        <item.icon size={18} />
                                    </div>
                                    <span className="font-bold dark:text-white">{item.name}</span>
                                    <span className="ml-auto text-xs font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        GO TO
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t-2 border-black dark:border-gray-700">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span className="flex items-center gap-1"><Command size={10} /> + K to open</span>
                        <span>ESC to close</span>
                    </div>
                    <div className="text-[10px] font-black text-spark-orange tracking-widest uppercase">
                        Sparkcode OS v1.2
                    </div>
                </div>
            </div>
        </div>
    );
}
