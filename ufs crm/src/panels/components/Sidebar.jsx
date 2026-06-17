import { NavLink } from 'react-router-dom';

const navMap = {
  super_admin: [
    { path: '/', label: 'Overview', icon: 'dashboard' },
    { path: '/ngos', label: 'NGOs', icon: 'business' },
    { path: '/users', label: 'All Users', icon: 'people' },
    { path: '/audit', label: 'Audit Log', icon: 'history' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/notices', label: 'Notices', icon: 'campaign' },
    { path: '/achievements', label: 'Achievements', icon: 'emoji_events' },
  ],
  hoadmin: [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/users', label: 'Manage Users', icon: 'supervisor_account' },
    { path: '/workers', label: 'Workers', icon: 'group' },
    { path: '/attendance', label: 'Attendance', icon: 'fact_check' },
    { path: '/leaves', label: 'Leaves', icon: 'event_note' },
    { path: '/qr', label: 'QR Codes', icon: 'qr_code' },
    { path: '/salary', label: 'Payroll', icon: 'payments' },
    { path: '/fro-targets', label: 'FRO Targets', icon: 'track_changes' },
    { path: '/letters', label: 'Letters', icon: 'description' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/notices', label: 'Notices', icon: 'campaign' },
    { path: '/achievements', label: 'Achievements', icon: 'emoji_events' },
  ],
  hr: [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/workers', label: 'Workers', icon: 'group' },
    { path: '/recruiters', label: 'Recruiters', icon: 'person_search' },
    { path: '/users', label: 'Users', icon: 'manage_accounts' },
    { path: '/attendance', label: 'Attendance', icon: 'fact_check' },
    { path: '/leaves', label: 'Leaves', icon: 'event_note' },
    { path: '/qr', label: 'QR Codes', icon: 'qr_code' },
    { path: '/salary', label: 'Payroll', icon: 'payments' },
    { path: '/fro-targets', label: 'FRO Targets', icon: 'track_changes' },
    {
      label: 'Letters',
      icon: 'description',
      children: [
        { path: '/letters', label: 'Templates' },
        { path: '/letters/new', label: 'New Template' },
        { path: '/letters/generate', label: 'Generate Letter' },
        { path: '/letters/generated', label: 'Generated' },
      ],
    },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/notices', label: 'Notices', icon: 'campaign' },
    { path: '/achievements', label: 'Achievements', icon: 'emoji_events' },
    { path: '/notifications/scheduled', label: 'Send Notification', icon: 'notifications' },
  ],
  accounts: [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/salary', label: 'Salary', icon: 'payments' },
    { path: '/reports', label: 'Reports', icon: 'assessment' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/notices', label: 'Notices', icon: 'campaign' },
    { path: '/achievements', label: 'Achievements', icon: 'emoji_events' },
  ],
  recruiter: [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/candidates', label: 'Candidates', icon: 'person_add' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/notices', label: 'Notices', icon: 'campaign' },
    { path: '/achievements', label: 'Achievements', icon: 'emoji_events' },
  ],
  leads: [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/leads-list', label: 'Leads', icon: 'fiber_new' },
    { path: '/call-logs', label: 'Call Logs', icon: 'phone_log' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/notices', label: 'Notices', icon: 'campaign' },
    { path: '/achievements', label: 'Achievements', icon: 'emoji_events' },
  ],
  telecaller: [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/leads', label: 'My Leads', icon: 'fiber_new' },
    { path: '/call-logs', label: 'Call Logs', icon: 'phone_log' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/notices', label: 'Notices', icon: 'campaign' },
    { path: '/achievements', label: 'Achievements', icon: 'emoji_events' },
  ],
  team_lead: [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/team', label: 'My Team', icon: 'groups' },
    { path: '/leads', label: 'Leads', icon: 'fiber_new' },
    { path: '/call-logs', label: 'Call Logs', icon: 'phone_log' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/notices', label: 'Notices', icon: 'campaign' },
    { path: '/achievements', label: 'Achievements', icon: 'emoji_events' },
  ],
};

function Sidebar({ role, user, onLogout }) {
  const items = navMap[role] || [];

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-primary text-on-primary border-r border-outline-variant shadow-sm flex flex-col py-6 z-50">
      <div className="px-6 mb-8">
        <h1 className="text-headline-md font-bold text-on-primary">UFS CRM</h1>
        <p className="text-label-md text-on-primary-container opacity-70 capitalize">{role.replace('_', ' ')}</p>
        {user?.ngo_name && (
          <p className="text-label-sm text-on-primary-container opacity-50 mt-1">{user.ngo_name}</p>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {items.map((item) => {
          if (item.children) {
            return (
              <div key={item.label}>
                <div className="flex items-center gap-3 px-4 py-2 text-label-sm text-on-primary-container opacity-70 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <div className="ml-4 space-y-0.5">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end={child.path === '/letters'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 text-label-md transition-all duration-200 rounded-lg ${
                          isActive
                            ? 'text-on-primary font-bold bg-primary-container'
                            : 'text-on-primary-container hover:bg-primary-container/50 hover:text-on-primary'
                        }`
                      }
                    >
                      <span className="text-label-md">{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-label-md transition-all duration-200 ${
                  isActive
                    ? 'border-l-4 border-secondary-fixed text-on-primary font-bold bg-primary-container'
                    : 'text-on-primary-container hover:bg-primary-container/50 hover:text-on-primary border-l-4 border-transparent'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4 px-4">
        <div className="flex items-center gap-3 px-2 py-2 text-on-primary-container text-label-sm">
          <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-primary text-sm font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-on-primary text-label-md font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-on-primary-container opacity-60 text-label-sm truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-on-primary-container hover:bg-primary-container/50 transition-colors w-full text-left rounded-lg mt-1"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-label-md">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
