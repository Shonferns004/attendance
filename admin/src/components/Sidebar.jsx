import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/workers', label: 'Workers', icon: 'group' },
  { path: '/add-worker', label: 'Add Worker', icon: 'person_add' },
  { path: '/assign-task', label: 'Assign Tasks', icon: 'assignment_turned_in' },
  { path: '/tasks', label: 'View Tasks', icon: 'list_alt' },
  { path: '/generate-qr', label: 'Generate QR', icon: 'qr_code' },
];

function Sidebar({ onLogout }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-primary text-on-primary border-r border-outline-variant shadow-sm flex flex-col py-6 z-50">
      <div className="px-6 mb-8">
        <h1 className="text-headline-md font-bold text-on-primary">TaskMaster Pro</h1>
        <p className="text-label-md text-on-primary-container opacity-70">Admin Management</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
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
            <span className="text-label-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4 space-y-1">
        <a className="flex items-center gap-3 px-4 py-3 text-on-primary-container hover:bg-primary-container/50 transition-colors cursor-pointer">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-label-md">Settings</span>
        </a>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-on-primary-container hover:bg-primary-container/50 transition-colors w-full text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-label-md">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
