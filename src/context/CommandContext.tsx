import React, { createContext, useContext, useState, useCallback } from 'react';

interface CommandContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    toggle: () => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export const CommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    return (
        <CommandContext.Provider value={{ isOpen, setIsOpen, toggle }}>
            {children}
        </CommandContext.Provider>
    );
};

export const useCommand = () => {
    const context = useContext(CommandContext);
    if (!context) throw new Error('useCommand must be used within a CommandProvider');
    return context;
};
