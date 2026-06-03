
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-10 rounded-[3rem] border border-red-100 shadow-2xl text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">System Interruption</h2>
            <p className="text-slate-500 font-bold mb-8">
              A localized error occurred in the intelligence layer. We've isolated the issue to protect your data.
            </p>
            <p className="text-xs font-bold text-slate-400 mb-8">
              If the problem persists, try clearing your browser cache or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
            >
              <RefreshCw size={18} />
              Re-initialize System
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
