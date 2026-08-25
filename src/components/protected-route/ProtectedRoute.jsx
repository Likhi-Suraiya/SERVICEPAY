// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { user, menuData } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check if route is in menu
  const isRouteAllowed = () => {
    if (
      location.pathname === "/" ||
      location.pathname === "/dashboard-all" ||
      location.pathname === "/home" ||
      location.pathname === "/video-gallery"
    ) {
      return true;
    }

    // If menuData is not loaded yet, allow access temporarily
    if (!menuData || menuData.length === 0) {
      return true;
    }

    try {
      // Flatten all menu items
      const allItems = menuData.flatMap((section) =>
        section.items.flatMap((item) =>
          item.submenu ? [item, ...item.submenu] : [item]
        )
      );
      // Find matching menu item
      const menuItem = allItems.find(
        (item) =>
          item.link === location.pathname ||
          (item.link && item.link === location.pathname + "/")
      );
      // If no menu item found for this route, allow access
      // If menu item found, check availability
      const allowed = !menuItem || menuItem.available !== false;

      return allowed;
    } catch (error) {

      return true;
    }
  };

  const allowed = isRouteAllowed();
  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};
