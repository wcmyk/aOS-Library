import { useProfileStore } from '../../state/useProfileStore';

export function SettingsApp() {
  const {
    fullName,
    preferredEmail,
    icloudEmail,
    roleHeadline,
    location,
    workdayRole,
    isPeopleManager,
    jobTitle,
    department,
    setProfile,
  } = useProfileStore();

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
        <label>Job title<input value={jobTitle} onChange={(e) => setProfile({ jobTitle: e.target.value })} /></label>
        <label>Department<input value={department} onChange={(e) => setProfile({ department: e.target.value })} /></label>
        <label>Workday role
          <select value={workdayRole} onChange={(e) => setProfile({ workdayRole: e.target.value as typeof workdayRole })}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="hrbp">HRBP</option>
            <option value="payroll_admin">Payroll Admin</option>
            <option value="legal_admin">Legal Admin</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={isPeopleManager}
            onChange={(e) => setProfile({ isPeopleManager: e.target.checked })}
            style={{ width: 'auto', marginRight: 8 }}
          />
          People manager (enables team approvals)
        </label>
      </div>
    </div>
  );
}
