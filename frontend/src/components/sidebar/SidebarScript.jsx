import { useState, useEffect } from "react";

export const useToggleDarkMode = (containerRef) => {
  const [isDarkMode, setIsDarkmode] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (container) {
      document.body.classList.toggle("dark", isDarkMode);
      document.body.classList.toggle("light", !isDarkMode);
    }
  }, [isDarkMode, containerRef]);

  const ToggleDarkMode = () => {
    setIsDarkmode((prevMode) => !prevMode);
  };

  return { isDarkMode, ToggleDarkMode };
};

export const useToggleClose = (sidebarRef) => {
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const sidebar = sidebarRef.current;

    if (sidebar) {
      sidebar.classList.toggle("close", isClosed);
    }
  }, [isClosed, sidebarRef]);

  const toggleSidebar = () => {
    setIsClosed((prevState) => !prevState);
  };

  return { isClosed, toggleSidebar };
};
