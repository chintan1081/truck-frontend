import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /**
   * When any value in this array changes the boundary clears its error and
   * re-renders its children. Pass the active route/tab so navigating away from a
   * broken screen automatically recovers it.
   */
  resetKeys?: unknown[];
  /** 'inline' renders a contained card (fits inside a layout); 'fullscreen' fills the viewport. */
  variant?: 'inline' | 'fullscreen';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const isDev = (import.meta as any)?.env?.DEV ?? false;

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.state.hasError) return;
    const prev = prevProps.resetKeys ?? [];
    const next = this.props.resetKeys ?? [];
    const changed = prev.length !== next.length || next.some((k, i) => !Object.is(k, prev[i]));
    if (changed) this.reset();
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    const { hasError, error } = this.state;
    const { children, variant = 'fullscreen' } = this.props;

    if (!hasError) return children;

    const wrapperCls =
      variant === 'fullscreen'
        ? 'min-h-screen bg-slate-50 flex items-center justify-center p-6'
        : 'w-full flex items-center justify-center p-6';

    return (
      <div className={wrapperCls}>
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] border border-red-100 shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8">
            <AlertCircle size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">System Interruption</h2>
          <p className="text-slate-500 font-bold mb-6">
            A localized error occurred in this section. The rest of the app is unaffected — you can retry
            or switch to another screen.
          </p>

          {error?.message && (
            <div className="mb-6 text-left bg-red-50 border border-red-100 rounded-2xl p-4">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Error detail</p>
              <p className="text-xs font-bold text-red-600 break-words">{error.message}</p>
              {isDev && error.stack && (
                <details className="mt-3">
                  <summary className="text-[10px] font-black text-red-400 uppercase tracking-widest cursor-pointer">
                    Stack trace
                  </summary>
                  <pre className="mt-2 text-[10px] text-red-500/80 whitespace-pre-wrap break-words max-h-48 overflow-auto">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={this.reset}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
            >
              <RotateCcw size={18} />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <RefreshCw size={18} />
              Re-initialize System
            </button>
          </div>
        </div>
      </div>
    );
  }
}
