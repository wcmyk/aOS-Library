import { Component, type ReactNode } from 'react';

// Per-window crash barrier: a render error inside one app must never unmount
// the whole desktop. Shows an in-window recovery panel instead, with a retry
// and a data-reset escape hatch for corrupt persisted state.

type Props = { appTitle: string; children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private retry = () => this.setState({ error: null });

  private resetData = () => {
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app-crash">
        <div className="app-crash-card">
          <span className="app-crash-icon" aria-hidden>!</span>
          <h2>{this.props.appTitle} quit unexpectedly</h2>
          <p>Something went wrong while rendering this app. You can try opening it again — if it keeps happening, resetting the simulation data usually clears it.</p>
          <p className="app-crash-detail">{String(this.state.error.message ?? this.state.error)}</p>
          <div className="app-crash-actions">
            <button type="button" className="app-crash-btn primary" onClick={this.retry}>Try Again</button>
            <button type="button" className="app-crash-btn" onClick={this.resetData}>Reset Simulation Data</button>
          </div>
        </div>
      </div>
    );
  }
}
