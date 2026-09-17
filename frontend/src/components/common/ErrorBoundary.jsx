import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert, Phone } from 'lucide-react';

/**
 * Global & Route-Level Error Boundary Component
 * 
 * Prevents blank screens by catching JavaScript runtime errors anywhere in child
 * component trees, logging the error, and displaying a festive, high-contrast fallback UI.
 * 
 * Modes:
 * - fallbackType="page" (default): Used inside App.jsx around <Routes> so Navbar & Footer always remain rendered.
 * - fallbackType="root": Used in main.jsx to catch catastrophic top-level failures.
 * - fallbackType="section": Compact inline card for individual widget failures.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('⚠️ [ErrorBoundary Caught Error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { fallbackType = 'page' } = this.props;

      // Section / Compact Inline Fallback
      if (fallbackType === 'section') {
        return (
          <div className="p-6 rounded-2xl bg-festival-card/80 border border-amber-500/30 text-center space-y-3 my-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Unable to load this section</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              A temporary issue occurred while rendering this component.
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      }

      // Root / Full Screen Fallback (When whole app crashes)
      if (fallbackType === 'root') {
        return (
          <div className="min-h-screen bg-festival-dark text-white flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
            <div className="w-full max-w-lg bg-festival-card border border-amber-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600/30 to-amber-500/30 border border-amber-500/40 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  S2C Crackers • Safe Recovery
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Something went wrong
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  We encountered an unexpected issue while loading the store. Your cart and data are preserved.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={this.handleReload}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Page</span>
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-festival-cardHover border border-festival-border hover:border-amber-400 text-amber-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to Homepage</span>
                </button>
              </div>

              <div className="pt-4 border-t border-festival-border/50 text-xs text-slate-400 flex items-center justify-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Customer Help: <a href="tel:+919944476516" className="text-amber-300 hover:underline font-semibold">+91 99444 76516</a></span>
              </div>
            </div>
          </div>
        );
      }

      // Page-Level Fallback (Navbar and Footer remain visible)
      return (
        <div className="min-h-[55vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
            <AlertTriangle className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>

          <div className="space-y-2 max-w-md">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Page Notice
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Unable to load this page
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              An unexpected error occurred while displaying this page. You can try refreshing or returning to the catalogue.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-festival-card hover:bg-festival-cardHover border border-festival-border hover:border-amber-400 text-amber-300 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
