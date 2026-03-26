// ErrorBoundary.tsx — Catches React render crashes and shows a recovery UI
// Prevents White Screen of Death across the entire app

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Component crash:', error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
          style={{ background: '#0A0A0A', color: '#F5F5F7' }}
        >
          <div
            className="rounded-2xl p-8 max-w-sm w-full"
            style={{
              background: 'rgba(28,28,30,0.55)',
              backdropFilter: 'blur(20px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</p>
            <h2
              style={{
                fontSize: '18px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                color: '#F5F5F7',
                marginBottom: '8px',
              }}
            >
              페이지를 불러올 수 없습니다
            </h2>
            <p
              style={{
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                color: '#86868B',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              일시적인 오류가 발생했습니다.
              <br />
              A temporary error occurred. Please try again.
            </p>
            <button
              onClick={this.handleReset}
              className="transition-all active:scale-[0.98]"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: '#2D6B4A',
                color: '#F5F5F7',
                fontSize: '14px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              새로고침 · Reload
            </button>
          </div>

          {/* Debug info (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <pre
              className="mt-6 text-left max-w-sm w-full overflow-auto"
              style={{
                fontSize: '10px',
                color: '#CF6679',
                background: 'rgba(207,102,121,0.08)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(207,102,121,0.2)',
                maxHeight: '120px',
              }}
            >
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack?.slice(0, 500)}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
