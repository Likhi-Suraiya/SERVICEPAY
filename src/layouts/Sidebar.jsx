// components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSidebar } from "../hooks/useSidebar";
import { useAuth } from "../context/AuthContext";
import { normalizeMenuData } from "../utils/menuUtils";

// Helper function to check if a path is active (supports nested routes and query parameters)
const isPathActive = (currentPath, targetPath) => {
  // Strip query parameters and hash from current path
  const cleanCurrentPath = currentPath.split("?")[0].split("#")[0];
  const cleanTargetPath = targetPath.split("?")[0].split("#")[0];

  return (
    cleanCurrentPath === cleanTargetPath ||
    cleanCurrentPath.startsWith(cleanTargetPath + "/") ||
    (cleanTargetPath !== "/" &&
      cleanCurrentPath.startsWith(cleanTargetPath) &&
      cleanCurrentPath[cleanTargetPath.length] !== "/")
  );
};

const MenuItem = ({ item, isCollapsed, onClick }) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get full path including query parameters
  const fullPath = location.pathname + location.search;

  // Check if current item is active (consider query parameters)
  const isActive = (() => {
    // If the item has no query parameters in its link, match only the path
    if (!item.link.includes("?")) {
      return (
        fullPath.startsWith(item.link) &&
        (fullPath === item.link ||
          fullPath.startsWith(item.link + "/") ||
          fullPath.startsWith(item.link + "?"))
      );
    }

    // If item has query parameters, need exact match including query params
    return fullPath === item.link;
  })();

  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const isSubmenuActive =
    hasSubmenu &&
    item.submenu.some((sub) => {
      if (!sub.link.includes("?")) {
        return (
          fullPath.startsWith(sub.link) &&
          (fullPath === sub.link ||
            fullPath.startsWith(sub.link + "/") ||
            fullPath.startsWith(sub.link + "?"))
        );
      }
      return fullPath === sub.link;
    });

  useEffect(() => {
    if ((!hasSubmenu && isActive) || (hasSubmenu && isSubmenuActive)) {
      setIsExpanded(true);
    }
  }, [hasSubmenu, isActive, isSubmenuActive, fullPath]);

  const handleNavLinkClick = (e) => {
    if (hasSubmenu) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    } else {
      onClick();
    }
  };

  return (
    <li
      className={`menu-item ${
        (!hasSubmenu && isActive) || (hasSubmenu && isSubmenuActive)
          ? "active "
          : ""
      } ${isExpanded ? "open" : ""}`}
      style={isCollapsed ? { width: "fit-content" } : {}}
    >
      <NavLink
        aria-label={`Go to ${item.text} ${
          item.available === false ? "(Pro)" : ""
        }`}
        to={item.link}
        className={`menu-link ${
          hasSubmenu && !isCollapsed ? "menu-toggle" : ""
        }`}
        target={item.link.includes("http") ? "_blank" : undefined}
        onClick={handleNavLinkClick}
        // Prevent NavLink from automatically adding active class
        isActive={(match, location) => {
          // We handle active state manually
          return false;
        }}
      >
        <i className={`menu-icon tf-icons ${item.icon}`}></i>
        {!isCollapsed && (
          <>
            <div>{item.text}</div>
            {item.available === false && (
              <div className="badge bg-label-primary fs-tiny rounded-pill ms-auto">
                Pro
              </div>
            )}
          </>
        )}
        {hasSubmenu && isCollapsed && item.available === false && (
          <div className="pro-indicator" title="Pro Feature">
            <i className="bx bx-crown text-warning"></i>
          </div>
        )}
      </NavLink>
      {hasSubmenu && isExpanded && !isCollapsed && (
        <ul className="menu-sub">
          {item.submenu.map((subItem) => (
            <MenuItem
              key={subItem.text}
              item={subItem}
              isCollapsed={isCollapsed}
              onClick={onClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const Sidebar = () => {
  const { isCollapsed, mobileOpen, closeMobile } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const { menuData } = useAuth(); // Get menuData from context

  // Show loading spinner while menuData is being loaded
  if (menuData === null) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading menu...</span>
        </div>
      </div>
    );
  }

  const normalizedMenu = normalizeMenuData(menuData || []);

  const handleLinkClick = () => {
    if (mobileOpen) {
      closeMobile();
    }
  };

  return (
    <>
      <aside
        id="layout-menu"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`layout-menu menu-vertical menu bg-menu-theme z-100 ${
          isCollapsed ? "collapsed" : ""
        } ${mobileOpen ? "mobile-show" : ""}`}
      >
        <div className="app-brand demo">
          <Link aria-label="Go to homepage" to="/" className="app-brand-link">
            {/* <span className="app-brand-logo demo">
              <img src="/assets/img/wd-sm.png" alt="logo" />
            </span>
            {!isCollapsed && (
              // <span className="app-brand-text demo menu-text fw-bold ms-2">
              //   Order360
              // </span>
            <span className="text-center d-flex justify-content-center align-items-center w-100">
              <img src="/assets/img/Order360_Logo_prg.png"
                style={{ height: '70px', width: 'auto', marginLeft:"20px", objectFit: 'contain' }}
                alt="logo" />
            </span>
            )} */}
            <span className="app-brand-logo demo">
              {/* Show small logo when collapsed, large logo when expanded */}
              {isCollapsed ? (
                <img
                  src="/assets/img/SERVICEPAY.jpg"
                  alt="logo"
                  style={{
                    height: "45px",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <img
                  src="/assets/img/SERVICEPAY.jpg"
                  style={{
                    height: "180px",
                    marginLeft: "-20px",
                    width: "auto",
                  
                    objectFit: "contain",
                  }}
                  alt="logo"
                />
              )}
            </span>
          </Link>

          <a
            href="#"
            className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none px-16"
            onClick={(e) => {
              e.preventDefault();
              closeMobile();
            }}
          >
            <i className={`bx bx-chevron-left bx-sm align-middle`}></i>
          </a>
        </div>
        {/* <div><hr style={{color: "black !importent"}} /></div> */}
        <div className="menu-inner-shadow"></div>
        <ul
          className={`menu-inner pb-5 scrollbar-thin overflow-scroll   
          `}
          // style={{ paddingBottom: "60px !importent" }}
        >
          {normalizedMenu.map((section) => (
            <React.Fragment key={section.header}>
              {section.header && !isCollapsed && (
                <li className="menu-header small text-uppercase">
                  <span className="menu-header-text">{section.header}</span>
                </li>
              )}
              {section.items.map((item) => (
                <MenuItem
                  key={item.text}
                  item={item}
                  isCollapsed={isCollapsed}
                  onClick={handleLinkClick}
                />
              ))}
            </React.Fragment>
          ))}
        </ul>
      </aside>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
            cursor: "pointer",
          }}
          onClick={closeMobile}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
