import { useState } from 'react';
import { useProfileStore } from '../../state/useProfileStore';

const COLOR_PRESETS = ['#0078d4','#107c10','#d13438','#7719aa','#ca5010','#00b4d2','#038387','#881798'];

export function SettingsApp() {
  const { firstName, lastName, avatarColor, acceptedJob, setProfile, setAvatarColor } = useProfileStore();
  const [localFirst, setLocalFirst] = useState(firstName);
  const [localLast, setLocalLast] = useState(lastName);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'appearance' | 'general'>('profile');

  const initials = ((localFirst[0] ?? '') + (localLast[0] ?? '')).toUpperCase() || 'U';
  const displayEmail = localFirst && localLast
    ? `${localFirst.toLowerCase()}.${localLast.toLowerCase()}@workspace.aos`
    : 'user@workspace.aos';

  const save = () => {
    setProfile(localFirst.trim(), localLast.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="stt-shell">
      <aside className="stt-sidebar">
        <div className="stt-sidebar-title">Settings</div>
        {(['profile','appearance','general'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`stt-nav-btn${activeSection === s ? ' active' : ''}`}
            onClick={() => setActiveSection(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </aside>

      <div className="stt-content">
        {activeSection === 'profile' && (
          <div className="stt-section">
            <div className="stt-section-title">Profile</div>
            <div className="stt-profile-row">
              <div
                className="stt-avatar"
                style={{ background: avatarColor }}
              >
                {initials}
              </div>
              <div className="stt-avatar-meta">
                <div className="stt-avatar-name">{localFirst || 'First'} {localLast || 'Last'}</div>
                <div className="stt-avatar-email">{displayEmail}</div>
              </div>
            </div>

            <div className="stt-field-row">
              <div className="stt-field">
                <label className="stt-label">First Name</label>
                <input className="stt-input" value={localFirst} onChange={(e) => setLocalFirst(e.target.value)} placeholder="First name" />
              </div>
              <div className="stt-field">
                <label className="stt-label">Last Name</label>
                <input className="stt-input" value={localLast} onChange={(e) => setLocalLast(e.target.value)} placeholder="Last name" />
              </div>
            </div>

            <div className="stt-field">
              <label className="stt-label">Avatar Color</label>
              <div className="stt-color-row">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`stt-color-swatch${avatarColor === c ? ' active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setAvatarColor(c)}
                  />
                ))}
              </div>
            </div>

            {acceptedJob && (
              <div className="stt-employment-card">
                <div className="stt-employment-label">Current Employment</div>
                <div className="stt-employment-role">{acceptedJob.role}</div>
                <div className="stt-employment-company">{acceptedJob.company}</div>
                <div className="stt-employment-meta">{acceptedJob.location} · {acceptedJob.salary}</div>
              </div>
            )}

            <button type="button" className="stt-save-btn" onClick={save}>
              {saved ? 'Saved' : 'Save Changes'}
            </button>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div className="stt-section">
            <div className="stt-section-title">Appearance</div>
            <div className="stt-desc">Wallpaper and visual settings. Workspace theme is always dark — optimized for focus.</div>
            <div className="stt-card">
              <div className="stt-card-label">Theme</div>
              <div className="stt-card-value">Dark (System Default)</div>
            </div>
            <div className="stt-card">
              <div className="stt-card-label">Accent Color</div>
              <div className="stt-card-value">Automatic</div>
            </div>
            <div className="stt-card">
              <div className="stt-card-label">Transparency</div>
              <div className="stt-card-value">Enabled</div>
            </div>
          </div>
        )}

        {activeSection === 'general' && (
          <div className="stt-section">
            <div className="stt-section-title">General</div>
            <div className="stt-card">
              <div className="stt-card-label">Workspace Name</div>
              <div className="stt-card-value">AngelOS Playground</div>
            </div>
            <div className="stt-card">
              <div className="stt-card-label">Build</div>
              <div className="stt-card-value">aOS 1.0 — Sanctum Edition</div>
            </div>
            <div className="stt-card">
              <div className="stt-card-label">Keyboard Shortcut</div>
              <div className="stt-card-value">⌘ + Space — Spotlight</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
