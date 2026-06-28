import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Component error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallback, name = 'Component' } = this.props;
      
      if (typeof fallback === 'function') {
        return fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset,
        });
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">
              <AlertTriangle size={32} />
            </div>
            <h3>{name} crashed</h3>
            <p>{this.state.error?.message || 'Something went wrong.'}</p>
            {this.state.errorInfo?.componentStack && (
              <details className="error-boundary-details">
                <summary>Stack trace</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            <button className="error-boundary-retry" onClick={this.handleReset}>
              <RotateCcw size={14} />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
