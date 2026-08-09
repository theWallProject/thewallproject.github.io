import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

// Top-level safety net so the site never renders a blank page. Any unexpected
// render/lifecycle error is caught here and swapped for a minimal recovery UI.
// WebGL-specific failures are handled before this boundary by the components
// themselves (see src/lib/webgl.ts); this catches everything else.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : undefined };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Caught an unexpected error:", error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          background: "#050505",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Something went wrong</h1>
        {this.state.message && <p style={{ opacity: 0.6, margin: 0 }}>{this.state.message}</p>}
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            padding: "0.6rem 1.5rem",
            borderRadius: "9999px",
            border: "none",
            background: "#b72b00",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
