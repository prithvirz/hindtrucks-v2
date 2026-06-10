import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackHeight?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[MapErrorBoundary]', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{ height: this.props.fallbackHeight ?? '250px' }}
                    className="bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-3 p-6 border border-gray-200"
                >
                    <AlertTriangle size={32} className="text-red-400" />
                    <p className="text-sm font-bold text-gray-700">Map failed to load</p>
                    <p className="text-xs text-gray-500 max-w-[240px] text-center">
                        The map tiles could not be loaded. This may be due to a network issue.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold active:scale-95 transition-transform"
                    >
                        <RefreshCw size={14} />
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}