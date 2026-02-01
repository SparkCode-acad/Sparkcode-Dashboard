import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatRole(role: string | undefined): string {
    if (!role) return 'Team';
    const lower = role.toLowerCase();
    if (lower === 'student') return 'Team';
    return role;
}
