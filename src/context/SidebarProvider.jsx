// context/SidebarProvider.jsx
import { useState, useCallback } from 'react';
import { useDeviceBreakpoints } from '../hooks/useBreakpoints';
import { SidebarContext } from './sidebarContext';

export const SidebarProvider = ({ children }) => {
  const { isMobile, isTablet } = useDeviceBreakpoints();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Toggle sidebar: mobile vs desktop behavior
  const toggle = useCallback(() => {
    if (isMobile || isTablet) {
      setMobileOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  }, [isMobile, isTablet]);
  
  const openMobile = useCallback(() => {
    setMobileOpen(true);
  }, []);
  
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);
  
  const closeAll = useCallback(() => {
    if (isMobile || isTablet) {
      setMobileOpen(false);
    } else {
      // On desktop, keep sidebar expanded when closing
      setIsCollapsed(false);
    }
  }, [isMobile, isTablet]);

  const value = {
    isCollapsed,
    mobileOpen,
    isMobile, isTablet,
    toggle,
    openMobile,
    closeMobile,
    closeAll,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};