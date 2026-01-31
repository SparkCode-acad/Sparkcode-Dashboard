import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans text-center">
                    <div className="bg-white p-8 border-2 border-black shadow-neo max-w-md w-full">
                        <div className="flex justify-center mb-4 text-red-500">
                            <AlertTriangle size={48} />
                        </div>
                        <h1 className="text-2xl font-bold mb-2 uppercase">Something went wrong</h1>
                        <p className="text-gray-600 mb-6 font-medium">
                            The application encountered an unexpected error.
                        </p>
                        <div className="bg-gray-100 p-4 border border-gray-300 rounded text-left mb-6 overflow-auto max-h-32">
                            <code className="text-xs text-red-600 font-mono">
                                {this.state.error?.message || "Unknown Error"}
                            </code>
                        </div>
                        <Button
                            onClick={() => window.location.href = '/'}
                            className="w-full"
                        >
                            Reload Dashboard
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
