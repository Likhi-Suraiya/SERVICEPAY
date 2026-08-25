// src/pages/portal/PortalLayout.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getPortalUser, clearPortalUser } from "../../api/portalapi";
import "./portal.css";

const LOGIN_ROUTE = "/";

export const PortalLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getPortalUser();

  useEffect(() => {
    if (!user) navigate(LOGIN_ROUTE, { replace: true });
    else if (user.mustChange && location.pathname !== "/portal/change-password") {
      navigate("/portal/change-password", { replace: true });
    }
  }, [location.pathname, navigate, user]);

  if (!user) return null;

  const logout = () => {
    clearPortalUser();
    navigate(LOGIN_ROUTE, { replace: true });
  };

  const links = [
    { to: "/portal", label: "Home", icon: "bx-home-alt-2" },
    { to: "/portal/history", label: "Services", icon: "bx-wrench" },
  ];

  return (
    <div className="blil-portal">
      <header className="portal-topbar">
        <div className="portal-topbar-inner">
          <button className="portal-brand" onClick={() => navigate("/portal")}>
            <span className="portal-brand-mark">
              <i className="bx bx-building-house" />
            </span>
            <span>
              <strong>PROPERTY LIFT</strong>
              <small>Building Care</small>
            </span>
          </button>

          <div className="portal-user">
            <div className="portal-avatar">
              {(user.companyName || user.customerName || "C").charAt(0).toUpperCase()}
            </div>
            <div className="portal-user-copy">
              <strong>{user.companyName || user.customerName || "Partner"}</strong>
              <small>Customer Portal</small>
            </div>
            <button className="portal-logout" onClick={logout} title="Logout">
              <i className="bx bx-log-out" />
            </button>
          </div>
        </div>
      </header>

      <main className="portal-content">
        <div className="portal-shell">{children}</div>
      </main>

      <nav className="portal-bottom-nav">
        {links.map((link) => (
          <button
            key={link.to}
            className={location.pathname === link.to ? "active" : ""}
            onClick={() => navigate(link.to)}
          >
            <i className={`bx ${link.icon}`} />
            <span>{link.label}</span>
          </button>
        ))}
        <button
          className={location.pathname === "/portal/account" ? "active" : ""}
          onClick={() => navigate("/portal/account")}
        >
          <i className="bx bx-user" />
          <span>Account</span>
        </button>
      </nav>
    </div>
  );
};
