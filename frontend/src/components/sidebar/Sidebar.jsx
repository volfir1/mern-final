// Sidebar.jsx
import React, { useState, useEffect, useRef } from "react"; // Remove Suspense
import { useNavigate } from "react-router-dom";
import { SidebarData } from "./SidebarData";
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase.config';
import { TokenManager } from '../../utils/tokenManager';
import { useAuth } from '../../utils/authContext';
import authApi from '../../api/authApi';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
  </div>
);
const SidebarItem = ({ icon, title, link, isOpen, isLogout = false }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);


  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // First clear local storage and tokens
      TokenManager.clearAuth();
      localStorage.clear();
      
      // Call API logout
      await authApi.logout();
      
      // Firebase signout
      await signOut(auth);
      
      // Clear auth context using logoutAction
      await logoutAction();
      
      // Navigate last
      navigate('/login', { replace: true });
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };


  const handleClick = async () => {
    if (isLogout) {
      if (isLoggingOut) return;
      
      try {
        setIsLoggingOut(true);
        
        // First clear local storage and tokens
        TokenManager.clearAuth();
        localStorage.clear();
        
        // Call API logout
        await authApi.logout();
        
        // Firebase signout
        await signOut(auth);
        
        // Clear auth context
        await logout();
        
        // Navigate last
        navigate('/login', { replace: true });
        
        toast.success('Logged out successfully');
      } catch (error) {
        console.error('Logout failed:', error);
        toast.error('Failed to logout. Please try again.');
        
        // Cleanup on error
        TokenManager.clearAuth();
        localStorage.clear();
        navigate('/login', { replace: true });
      } finally {
        setIsLoggingOut(false);
      }
    } else {
      navigate(link);
    }
  };

  return (
    <div
      className={`group relative flex items-center p-2 mt-2 cursor-pointer 
        transition-all duration-200 hover:bg-red-500 hover:text-white 
        ${isLoggingOut ? 'opacity-75 cursor-not-allowed' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-center min-w-[60px] group-hover:text-white text-gray-800">
        {isLoggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      </div>
      <span
        className={`font-light transition-all duration-200 text-gray-800 
          group-hover:text-white ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}
      >
        {isLoggingOut ? 'Logging out...' : title}
      </span>
    </div>
  );
};


const UserProfile = ({ user, isOpen }) => {
  const formatName = (name) => name || 'User';
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : 'U';
  const formatRole = (role) => role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'User';

  return (
    <div className="flex items-center justify-between p-4 overflow-hidden border-b border-gray-200">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center 
          justify-center font-bold flex-shrink-0">
          {getInitial(user?.name)}
        </div>
        <div
          className={`transition-all duration-300 ml-2 
            ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"}`}
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

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleMouseEnter = () => setIsOpen(true);
    const handleMouseLeave = () => setIsOpen(false);
    const sidebar = sidebarRef.current;

    if (sidebar) {
      sidebar.addEventListener("mouseenter", handleMouseEnter);
      sidebar.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        sidebar.removeEventListener("mouseenter", handleMouseEnter);
        sidebar.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div
    ref={sidebarRef}
    className={`font-helvetica fixed top-0 left-0 h-full bg-white shadow-lg 
      transition-all duration-300 ease-in-out z-50 ${isOpen ? "w-64" : "w-20"}`}
  >
    <UserProfile user={user} isOpen={isOpen} />

    <nav className="mt-8">
      <ul className="space-y-2">
        {SidebarData.map((item, index) => (
          <SidebarItem
            key={item.title || index}
            icon={item.icon}
            title={item.title}
            link={item.link}
            isOpen={isOpen}
          />
        ))}
      </ul>
    </nav>

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
};

export default Sidebar;