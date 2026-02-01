import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const [confirm, setConfirm] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirm({ title, message, onConfirm });
    };

    const handleConfirm = () => {
        if (confirm) {
            confirm.onConfirm();
            setConfirm(null);
        }
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast, showConfirm }}>
            {children}

            {/* Confirmation Dialog */}
            {confirm && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm mx-4 border-2 border-black shadow-neo-lg p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold uppercase mb-2">{confirm.title}</h3>
                        <p className="text-gray-600 font-medium mb-6">{confirm.message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirm(null)}
                                className="flex-1 px-4 py-2 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 px-4 py-2 bg-spark-orange border-2 border-black font-bold shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 min-w-[300px] border-2 border-black bg-white shadow-neo animate-in slide-in-from-right-full duration-300 pointer-events-auto",
                            toast.type === 'success' && "border-green-500 shadow-[4px_4px_0px_0px_#22c55e]",
                            toast.type === 'error' && "border-red-500 shadow-[4px_4px_0px_0px_#ef4444]",
                            toast.type === 'warning' && "border-yellow-500 shadow-[4px_4px_0px_0px_#eab308]",
                            toast.type === 'info' && "border-blue-500 shadow-[4px_4px_0px_0px_#3b82f6]"
                        )}
                    >
                        <div className={cn(
                            "p-1 rounded",
                            toast.type === 'success' && "bg-green-100 text-green-600",
                            toast.type === 'error' && "bg-red-100 text-red-600",
                            toast.type === 'warning' && "bg-yellow-100 text-yellow-600",
                            toast.type === 'info' && "bg-blue-100 text-blue-600"
                        )}>
                            {toast.type === 'success' && <CheckCircle size={20} />}
                            {toast.type === 'error' && <XCircle size={20} />}
                            {toast.type === 'warning' && <AlertCircle size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                        </div>
                        <p className="flex-1 font-bold text-sm text-black">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X size={16} className="text-gray-400" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
