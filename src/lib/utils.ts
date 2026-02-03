import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatRole(role: string | undefined): string {
    if (!role) return 'Team Member';
    const lower = role.toLowerCase();
    if (lower === 'admin') return 'Admin';
    return 'Team Member';
}
