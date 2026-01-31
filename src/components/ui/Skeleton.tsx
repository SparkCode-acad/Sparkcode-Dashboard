import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-700", className)}
            {...props}
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="p-6 border-2 border-black dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-neo-sm space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-48" />
            </div>
        </div>
    );
}

export function SkeletonTable() {
    return (
        <div className="space-y-4 w-full">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b-2 border-black">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
            </div>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-4 border-b border-gray-100">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>
            ))}
        </div>
    );
}
