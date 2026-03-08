import type { VirtueInstallState } from '../../../types/virtue';

type Props = {
  state: VirtueInstallState;
  onInstall: () => void;
  onOpen: () => void;
  onUpdate: () => void;
};

export function InstallButton({ state, onInstall, onOpen, onUpdate }: Props) {
  if (state === 'installing') {
    return <button type="button" className="virtue-install-btn installing" disabled>Installing…</button>;
  }

  if (state === 'installed') {
    return <button type="button" className="virtue-install-btn secondary" onClick={onOpen}>Open</button>;
  }

  if (state === 'update_available') {
    return <button type="button" className="virtue-install-btn" onClick={onUpdate}>Update</button>;
  }

  return <button type="button" className="virtue-install-btn" onClick={onInstall}>Get</button>;
}
