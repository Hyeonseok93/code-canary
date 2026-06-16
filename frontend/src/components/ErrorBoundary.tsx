import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Button from './common/Button';
import fuzzle from '../assets/fuzzle.png';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_error: Error): State {
    void _error;
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void error;
    void errorInfo;
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 bg-[#000000] text-center">
          <div className="max-w-[400px] space-y-6 animate-reveal">
            <img
              src={fuzzle}
              alt="Runtime Error"
              className="w-full max-w-[280px] mx-auto opacity-85 object-contain animate-glitch"
            />

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Runtime Crashed</h1>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={this.handleReload}
                className="px-8 py-2.5 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700 transition-all"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
