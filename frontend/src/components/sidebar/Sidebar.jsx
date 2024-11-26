import React, { useState, useEffect, useRef, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarData } from "./SidebarData";
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import LoadingFallback from "../ui/loader";
import { useAuth } from '../../utils/authContext';

const SidebarItem = ({ icon, title, link, isOpen, isLogout = false }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleClick = async () => {
    if (isLogout) {
      try {
        await logout();
        navigate("/login");
      } catch (error) {
        console.error("Logout failed:", error);
        // Optionally show an error notification
      }
    } else {
      navigate(link);
    }
  };

  return (
    <div
      className="group relative flex items-center p-2 mt-2 cursor-pointer transition-all duration-200 hover:bg-red-500 hover:text-white"
      onClick={handleClick}
    >
      <div className="flex items-center justify-center min-w-[60px] group-hover:text-white text-gray-800">
        {icon}
      </div>
      <span
        className={`font-light transition-all duration-200 text-gray-800 group-hover:text-white ${
          isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
        }`}
      >
        {title}
      </span>
    </div>
  );
};

const UserProfile = ({ user, isOpen }) => {
  // Format name - choose the format you prefer
  const formatName = (name) => {
    if (!name) return 'User';
    // Option 1: Full name
    return name;
    // Option 2: First word only
    // return name.split(' ')[0];
    // Option 3: Initials
    // return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  // Get first letter for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Format role with capitalization
  const formatRole = (role) => {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  return (
    <div className="flex items-center justify-between p-4 overflow-hidden border-b border-gray-200">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
          {getInitial(user?.name)}
        </div>
        <div
          className={`transition-all duration-300 ml-2 ${
            isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
          }`}
        >
          <h2 className="text-xs font-light text-gray-800 uppercase tracking-wide">
            Welcome, {formatName(user?.name)}
          </h2>
          <p className="text-xs text-gray-600 uppercase">
            {formatRole(user?.role)}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleMouseEnter = () => setIsOpen(true);
    const handleMouseLeave = () => setIsOpen(false);

    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.addEventListener("mouseenter", handleMouseEnter);
      sidebar.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener("mouseenter", handleMouseEnter);
        sidebar.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  // If user data is loading or not available
  if (!user) {
    return <LoadingFallback />;
  }

  return (
    <div
      ref={sidebarRef}
      className={`font-helvetica fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 ease-in-out z-50 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* User Profile Section */}
      <UserProfile user={user} isOpen={isOpen} />

      {/* Navigation Section */}
      <nav className="mt-8">
        <ul className="space-y-2">
          {SidebarData.map((item, index) => (
            <Suspense fallback={<LoadingFallback />} key={item.title || index}>
              <SidebarItem
                icon={item.icon}
                title={item.title}
                link={item.link}
                isOpen={isOpen}
              />
            </Suspense>
          ))}
        </ul>
      </nav>

      {/* Footer Section */}
      <div className="absolute bottom-4 left-0 w-full overflow-hidden border-t border-gray-200 pt-4">
        <ul className="space-y-2">
          <SidebarItem
            icon={<Cog6ToothIcon className="w-6 h-6" />}
            title="Settings"
            link="/admin/settings"
            isOpen={isOpen}
          />
          <SidebarItem
            icon={<ArrowRightOnRectangleIcon className="w-6 h-6" />}
            title="Logout"
            link="/login"
            isOpen={isOpen}
            isLogout={true}
          />
        </ul>
      </div>
    </div>
  );
}