import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg mx-4 border-2 border-black shadow-neo-lg animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b-2 border-black p-4 bg-spark-orange">
                    <h3 className="text-xl font-bold uppercase tracking-wider">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-white"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 max-h-[85vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
