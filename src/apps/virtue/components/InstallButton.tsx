import type { VirtueInstallState } from '../../../types/virtue';

type InstallButtonProps = {
  state: VirtueInstallState;
  onInstall: () => void;
  onOpen: () => void;
  onUpdate: () => void;
};

export function InstallButton({ state, onInstall, onOpen, onUpdate }: InstallButtonProps) {
  if (state === 'installing') {
    return (
      <button type="button" className="virtue-install-button installing" disabled aria-label="Installing app">
        Installing…
      </button>
    );
  }

  if (state === 'installed') {
    return (
      <button type="button" className="virtue-install-button secondary" onClick={onOpen}>
        Open
      </button>
    );
  }

  if (state === 'update_available') {
    return (
      <button type="button" className="virtue-install-button" onClick={onUpdate}>
        Update
      </button>
    );
  }

  return (
    <button type="button" className="virtue-install-button" onClick={onInstall}>
      Get
    </button>
  );
}
