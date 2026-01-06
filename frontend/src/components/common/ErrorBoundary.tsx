import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[ErrorBoundary] ${this.props.name || 'Component'} error:`, error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
                    <p className="text-gray-600 mb-6 max-w-md">
                        Trang quản trị không tải được đúng cách. Nguyên nhân có thể là do sự cố tạm thời hoặc dữ liệu không hợp lệ.
                    </p>
                    <div className="flex gap-3">
                        <Button onClick={() => window.location.reload()} variant="outline" className="flex items-center gap-2">
                            <RefreshCcw className="w-4 h-4" />
                            Tải lại trang
                        </Button>
                        <Button onClick={this.handleRetry} className="bg-blue-600">
                            Thử lại
                        </Button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="mt-8 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-w-full max-h-40 text-red-700">
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
