// components/Layout.jsx
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { SidebarProvider } from '../context/SidebarProvider';
import {useSidebar} from '../hooks/useSidebar';

const LayoutContent = ({ children }) => {
  const { mobileOpen, closeMobile, isCollapsed } = useSidebar();
  
  // Close mobile sidebar when clicking outside (on backdrop)
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('sidebar-backdrop')) {
      closeMobile();
    }
  };

  return (
    <div className={`layout-wrapper layout-content-navbar ${isCollapsed ? 'layout-collapsed' : ''}`}>
      <div className="layout-container">
        <Sidebar />
        {mobileOpen && <div className="sidebar-backdrop" onClick={handleBackdropClick}></div>}
        <div className="layout-page">
          <Navbar />
          <div className="content-wrapper">
            <div className="p-2">{children}</div>
            {/* <Footer /> */}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  useEffect(() => {
    // Initialize layout scripts if needed
    if (typeof window !== 'undefined') {
      // Example of potential initialization
      // import('../utils/layout').then(module => {
      //   module.initLayout();
      // });
      
      // You can add any global initialization logic here
      // Main();
    }
  }, []);

  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
};

export default Layout;