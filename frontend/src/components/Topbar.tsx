import { LogOut } from "lucide-react";
import hpeLogo from "../assets/hpe-logo.png";

interface TopbarProps {
  role: string;
  onLogout: () => void;
}

const Topbar = ({ role, onLogout }: TopbarProps) => {

  /* ================= GET NAME FROM TOKEN ================= */

  const getUserName = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "User";

      const payload = JSON.parse(atob(token.split(".")[1]));

      if (!payload?.email) return "User";

      const email = payload.email.split("@")[0]; // shanu.saha
      const firstName = email.split(".")[0]; // shanu

      return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    } catch {
      return "User";
    }
  };

  const userName = getUserName();

  return (
    <header
      className="
      sticky top-0 z-40
      bg-white
      border-b
      flex items-center justify-between
      px-8
      h-20
      shadow-sm
    "
    >

      {/* LEFT LOGO */}
      <div className="flex items-center">
        <img
          src={hpeLogo}
          alt="HPE"
          className="
            h-14
            w-auto
            object-contain
            transition-transform duration-300
            hover:scale-105
          "
        />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-6">

       

        {/* ✅ BADGE NOW SHOWS NAME INSTEAD OF ROLE */}
        <span
          className="
          text-xs
          bg-emerald-100
          text-emerald-700
          px-4 py-1
          rounded-full
          font-medium
          tracking-wide
        "
        >
          {userName}
        </span>

        {/* LOGOUT */}
        <button
          onClick={onLogout}
          className="
            flex items-center gap-2
            text-sm text-gray-600
            hover:text-red-600
            transition
          "
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>

    </header>
  );
};

export default Topbar;