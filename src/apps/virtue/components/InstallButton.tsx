import type { VirtueInstallState } from '../../../types/virtue';

type InstallButtonProps = {
  state: VirtueInstallState;
  progress?: number; // 0-100 during installing
  onInstall: () => void;
  onOpen: () => void;
  onUpdate: () => void;
};

// macOS App Store-style circular download progress ring
function DownloadRing({ progress }: { progress: number }) {
  const size = 28;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <span className="virtue-download-ring" aria-hidden="true">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(100,120,200,0.25)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#4f8cff"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.08s linear' }}
        />
      </svg>
      <span className="virtue-download-stop" />
    </span>
  );
}

export function InstallButton({ state, progress = 0, onInstall, onOpen, onUpdate }: InstallButtonProps) {
  if (state === 'installing') {
    return (
      <button
        type="button"
        className="virtue-install-button installing"
        disabled
        aria-label={`Downloading ${Math.round(progress)}%`}
      >
        <DownloadRing progress={progress} />
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
