import * as React from "react"
import { cn } from "../../lib/utils"

/* Simple Badge Component without cva dependency */
const badgeVariants = {
    default: "border-transparent bg-spark-orange text-black hover:bg-spark-orange/80",
    secondary: "border-transparent bg-spark-purple text-white hover:bg-spark-purple/80",
    outline: "text-foreground border-2 border-black",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-500/80",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: keyof typeof badgeVariants
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variantStyles = badgeVariants[variant]

    return (
        <div
            className={cn(
                "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-black shadow-neo-sm",
                variantStyles,
                className
            )}
            {...props}
        />
    )
}

export { Badge }
