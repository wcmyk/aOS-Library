import { useProfileStore } from '../../state/useProfileStore';

export function SettingsApp() {
  const { fullName, preferredEmail, icloudEmail, roleHeadline, location, setProfile } = useProfileStore();

  return (
    <div className="simple-site">
      <h2>Settings</h2>
      <div className="simple-card">
        <h3>Identity</h3>
        <label>Full name<input value={fullName} onChange={(e) => setProfile({ fullName: e.target.value })} /></label>
        <label>Primary email<input value={preferredEmail} onChange={(e) => setProfile({ preferredEmail: e.target.value })} /></label>
        <label>iCloud profile email<input value={icloudEmail} onChange={(e) => setProfile({ icloudEmail: e.target.value })} /></label>
        <label>Headline<input value={roleHeadline} onChange={(e) => setProfile({ roleHeadline: e.target.value })} /></label>
        <label>Location<input value={location} onChange={(e) => setProfile({ location: e.target.value })} /></label>
      </div>
    </div>
  );
}
