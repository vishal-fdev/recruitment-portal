import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { authService } from '../auth/authService';

const roleLabelMap: Record<string, string> = {
  VENDOR: 'Vendor',
  VENDOR_MANAGER: 'Vendor Manager',
  HIRING_MANAGER: 'Hiring Manager',
};

const Topbar = () => {
  const navigate = useNavigate();
  const role = authService.getRole();

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      {/* Left */}
      <h1 className="text-lg font-semibold text-gray-800">
        Epicenter
      </h1>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Role Badge */}
        {role && (
          <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
            {roleLabelMap[role]}
          </span>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
        >
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
