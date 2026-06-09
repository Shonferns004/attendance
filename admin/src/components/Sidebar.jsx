import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/add-worker', label: 'Add Worker', icon: '👤' },
  { path: '/workers', label: 'View Workers', icon: '👥' },
  { path: '/assign-task', label: 'Assign Task', icon: '📋' },
  { path: '/tasks', label: 'View Tasks', icon: '✅' },
  { path: '/generate-qr', label: 'Generate QR', icon: '📷' },
];

function Sidebar({ onLogout }) {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <p className="text-sm text-gray-400 mt-1">Attendance System</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
