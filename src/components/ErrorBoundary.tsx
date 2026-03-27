import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import useErrorStore from '../stores/useErrorStore';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    useErrorStore.getState().captureError({
      message: error.message,
      stack: error.stack,
      component: errorInfo.componentStack || undefined,
      severity: 'fatal',
      action: 'React ErrorBoundary',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 bg-danger-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-danger-500" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-500 mb-6">An unexpected error occurred. Please try refreshing the page.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              className="btn-primary"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
