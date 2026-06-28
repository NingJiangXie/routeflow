import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../app/components/ErrorBoundary.jsx';

function Bomb({ shouldThrow = false }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Normal content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders fallback when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary name="TestComponent">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('TestComponent crashed')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renders error message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Test error')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const customFallback = ({ error, reset }) => (
      <div>
        <p>Custom fallback: {error.message}</p>
        <button onClick={reset}>Retry</button>
      </div>
    );
    render(
      <ErrorBoundary fallback={customFallback}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback: Test error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    spy.mockRestore();
  });
});
