// components/Navbar.jsx
import { useSidebar } from "../hooks/useSidebar";
import getGreetingMessage from "../utils/greetingHandler";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import routeTitles from "../data/routeTitles.json";
import "../layouts/layout.css";
import EnhancedAnimatedButton from "./../components/animated-button/EnhancedAnimatedButton";

const Navbar = () => {
  const { toggle, isCollapsed } = useSidebar();
  const { user, userType, logout, isDashboardMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [currentPageTitle, setCurrentPageTitle] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const notificationRef = useRef(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [animationType, setAnimationType] = useState("pulsing");
  const [domainClass, setDomainClass] = useState("");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Suggested DO",
      message: "AI has suggested a new delivery order for you",
      time: "Just now",
      read: false,
    },
  ]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Domain detection
  useEffect(() => {
    const host = window.location.host;
    const hostname = window.location.hostname;

    if (
      host.includes("runner.rflgroupbd.com") ||
      hostname === "runner.rflgroupbd.com"
    ) {
      setDomainClass("rfl-navbar");
    } else {
      setDomainClass("");
    }
  }, []);

  // Time update effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time based on site
  const getFormattedTime = () => {
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    if (user?.site === "35005") {
      options.timeZone = "Asia/Dhaka";
    } else {
      options.timeZone = "Asia/Kolkata";
    }

    return currentTime.toLocaleString("en-US", options);
  };

  const getTimezoneName = () => {
    return user?.site === "35005" ? "BD" : "IN";
  };

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const handleSuggestedDoClick = () => {
    setShowNotifications(false);
    navigate("/suggested-do");
  };

 

  const getPageTitle = (pathname) => {
    return routeTitles[pathname] || "Page";
  };

  useEffect(() => {
    setCurrentPageTitle(getPageTitle(location.pathname));
  }, [location.pathname]);

 

  // Notification animations
  useEffect(() => {
    const bufferingTimer = setTimeout(() => {
      setIsBuffering(false);
      setAnimationType("bellRing");
    }, 3000);

    const animationTimer = setInterval(() => {
      if (!isBuffering) {
        const animations = ["bellRing", "pulsing", "shaking"];
        const randomAnimation =
          animations[Math.floor(Math.random() * animations.length)];
        setAnimationType(randomAnimation);
      }
    }, 5000);

    return () => {
      clearTimeout(bufferingTimer);
      clearInterval(animationTimer);
    };
  }, [isBuffering]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);

    if (!showNotifications && notificationCount > 0) {
      setNotificationCount(0);
      setNotifications(
        notifications.map((notif) => ({ ...notif, read: true })),
      );
      setIsBuffering(false);
      setAnimationType("");
    }
  };

  // Improved click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside notification dropdown and not on the bell icon
      if (
        showNotifications &&
        notificationRef.current &&
        !notificationRef.current.contains(e.target) &&
        !e.target.closest(".notification-bell-trigger")
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const getBellAnimationClass = () => {
    if (isBuffering) return "notification-bell buffering";
    if (notificationCount > 0 && animationType) {
      return `notification-bell ${animationType} notification-glow`;
    }
    return "notification-bell";
  };

  // Notification Dropdown Component (to avoid code duplication)
  const NotificationDropdown = () => (
    <div
      ref={notificationRef}
      className="dropdown-notifications dropdown-menu show p-0"
      style={{
        position: "fixed",
        top: isMobile ? "80px" : "70px",
        right: "20px",
        width: isMobile ? "calc(100% - 40px)" : "380px",
        maxWidth: "380px",
        zIndex: 1050,
        display: "block",
        borderRadius: "8px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <div className="dropdown-notifications-header py-2 px-3 border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Notifications</h5>
          <span className="badge bg-primary ms-2">{notificationCount} New</span>
        </div>
      </div>
      <div
        className="dropdown-notifications-list"
        style={{ maxHeight: "400px", overflowY: "auto" }}
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="dropdown-notifications-item py-2 px-3 border-bottom"
            >
              <div className="d-flex">
                <div className="flex-shrink-0 me-3">
                  <div
                    className="avatar avatar-sm bg-light-primary rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "40px", height: "40px" }}
                  >
                    <i className="bx bx-bell fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-1">{notification.title}</h6>
                  <p className="mb-1 small">{notification.message}</p>
                  <small className="text-muted">{notification.time}</small>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <i className="bx bx-bell-off fs-1 text-muted"></i>
            <p className="mt-2 mb-0 text-muted">No notifications</p>
          </div>
        )}
      </div>
      <div className="dropdown-notifications-footer py-2 px-3 text-center border-top">
        <EnhancedAnimatedButton
          onClick={handleSuggestedDoClick}
          animationType="continuous-bounce-micro"
          size="medium"
          variant="primary"
        >
          Suggested DO
        </EnhancedAnimatedButton>
      </div>
    </div>
  );

  return (
    <>
      <nav
        className={`layout-navbar navbar navbar-expand-xl fixed-top align-items-center bg-navbar-theme z-50 ${
          isCollapsed ? "collapsed" : ""
        } ${domainClass}`}
        id="layout-navbar"
        style={{ position: "relative" }}
      >
        {/* Desktop Toggle */}
        <div
          className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-none d-xl-block"
          style={{ marginLeft: "20px" }}
        >
          <a
            aria-label="Toggle sidebar"
            className="nav-item nav-link px-0 me-xl-4"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toggle();
            }}
          >
            <i
              className={`bx ${
                isCollapsed ? "bx-menu" : "bx-menu-alt-left"
              } bx-sm`}
            ></i>
          </a>
        </div>

        {/* Mobile Toggle */}
        <div
          className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-block d-xl-none"
          style={{ marginLeft: "20px" }}
        >
          <a
            aria-label="Open mobile menu"
            className="nav-item nav-link px-0 me-xl-4"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toggle();
            }}
          >
            <i className="bx bx-menu bx-sm"></i>
          </a>
        </div>

        <div
          className="navbar-nav-right p-4 d-flex align-items-center"
          id="navbar-collapse"
        >
          {/* Desktop Layout */}
          {!isMobile && (
            <div className="d-flex align-items-center w-100">
              

              {/* Center section - Current Time */}
              <div className="position-absolute start-50 translate-middle-x">
                <div className="current-time-display d-flex align-items-center bg-light rounded-pill px-3 py-1 shadow-sm">
                  <i className="bx bx-time me-2 text-primary"></i>
                  <span className="fw-semibold">{getFormattedTime()}</span>
                  <span className="badge bg-primary ms-2">
                    {getTimezoneName()}
                  </span>
                </div>
              </div>

              {/* Right section - Icons */}
              <div className="ms-auto">
                <ul className="navbar-nav flex-row align-items-center">
                  {/* {!isDashboardMode && userType !== "D" && ( */}
                  {userType == "H" && (
                    <li className="nav-item me-2 me-xl-2">
                      <a
                        className="nav-link show"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPartnerModal(true);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <i className="icon-base bx bx-grid-alt icon-md"></i>
                      </a>
                    </li>
                  )}

                

                  {!isDashboardMode && (
                    <li
                      className="nav-item dropdown-notifications navbar-dropdown dropdown me-2 me-xl-2"
                      style={{ position: "relative" }}
                    >
                      <a
                        className="nav-link dropdown-toggle hide-arrow notification-bell-trigger"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNotificationClick();
                        }}
                        style={{ cursor: "pointer", position: "relative" }}
                      >
                        <span className="position-relative">
                          <i
                            className={`icon-base bx bx-bell icon-md ${getBellAnimationClass()}`}
                          ></i>
                          {notificationCount >= 0 && (
                            <span className="badge rounded-pill bg-danger border position-absolute notification-counter-badge">
                              {isBuffering ? (
                                <span className="loading-dots">
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </span>
                              ) : (
                                notificationCount
                              )}
                            </span>
                          )}
                        </span>
                      </a>
                    </li>
                  )}

                  <li className="nav-item navbar-dropdown dropdown-user dropdown">
                    <a
                      aria-label="Profile dropdown"
                      className="nav-link dropdown-toggle hide-arrow"
                      href="#"
                      data-bs-toggle="dropdown"
                    >
                      <div className="avatar avatar-online">
                        <img
                          src={
                            user?.profilePicture ||
                            "../assets/img/avatars/avatar3.jpg"
                          }
                          className="w-px-40 h-auto rounded-circle"
                          alt="avatar"
                        />
                      </div>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <a className="dropdown-item" href="#">
                          <div className="d-flex">
                            <div className="flex-shrink-0 me-3">
                              <div className="avatar avatar-online position-relative">
                                <img
                                  src={
                                    user?.profilePicture ||
                                    "../assets/img/avatars/avatar3.jpg"
                                  }
                                  className="w-px-40 h-auto rounded-circle"
                                  alt="avatar"
                                />
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <span className="fw-medium d-block">
                                {user?.staffName}
                              </span>
                              <small className="text-muted">
                                {user?.staffId}
                              </small>
                              <br />
                              <small className="text-muted">
                                Site: {user?.sitE_NAME}
                              </small>
                            </div>
                          </div>
                        </a>
                      </li>
                      <li>
                        <div className="dropdown-divider"></div>
                      </li>
                      {!isDashboardMode && (
                        <li>
                          <Link className="dropdown-item" to="/user-profile">
                            <i className="bx bx-user me-2"></i>{" "}
                            <span className="align-middle">My Profile</span>
                          </Link>
                        </li>
                      )}
                      <li>
                        <a
                          className="dropdown-item"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLogout();
                          }}
                        >
                          <i className="bx bx-power-off me-2"></i>{" "}
                          <span className="align-middle">Log Out</span>
                        </a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Mobile Layout */}
          {isMobile && (
            <div className="d-flex align-items-center w-100 justify-content-between">
              {/* Left section - Greeting/Title and Time stacked vertically */}
              {/* <div className="flex-grow-1"> */}
              {/* Top - Greeting/Title */}
              {/* <div className="mb-1">
                  {isHomePage ? (
                    getGreetingMessage(user, userType)
                  ) : (
                    <span className="fw-bold color-blue">
                      {currentPageTitle}
                    </span>
                  )}
                </div> */}

              {/* Bottom - Time */}
              {/* <div className="current-time-display d-inline-flex align-items-center bg-light rounded-pill px-3 py-1 shadow-sm">
                  <i className="bx bx-time me-2 text-primary"></i>
                  <span className="fw-semibold">{getFormattedTime()}</span>
                  <span className="badge bg-primary ms-2">
                    {getTimezoneName()}
                  </span>
                </div> */}
              {/* </div> */}

              <div className="current-time-display d-inline-flex align-items-center bg-light rounded-pill px-3 py-1 shadow-sm">
                <i className="bx bx-time me-2 text-primary"></i>
                <span className="fw-semibold">{getFormattedTime()}</span>
                <span className="badge bg-primary ms-2">
                  {getTimezoneName()}
                </span>
              </div>

              {/* Right section - Icons */}
              <div className="ms-auto">
                <ul className="navbar-nav flex-row align-items-center">
                  {/* Partner selection icon */}
                  {/* {!isDashboardMode && userType !== "D" && (
                    <li className="nav-item me-2">
                      <a
                        className="nav-link show"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPartnerModal(true);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <i className="icon-base bx bx-grid-alt icon-md"></i>
                      </a>
                    </li>
                  )} */}
                  {/* // Partner selection icon - ALWAYS show for staff users */}
                  {userType === "H" && (
                    <li className="nav-item me-2 me-xl-2">
                      <a
                        className="nav-link show"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPartnerModal(true);
                        }}
                        style={{ cursor: "pointer" }}
                        title="Select Partner"
                      >
                        <i className="icon-base bx bx-grid-alt icon-md"></i>
                      </a>
                    </li>
                  )}
                
                  {/* Notification icon */}
                  {!isDashboardMode && (
                    <li
                      className="nav-item me-2"
                      style={{ position: "relative" }}
                    >
                      <a
                        className="nav-link dropdown-toggle hide-arrow notification-bell-trigger"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNotificationClick();
                        }}
                        style={{ cursor: "pointer", position: "relative" }}
                      >
                        <span className="position-relative">
                          <i
                            className={`icon-base bx bx-bell icon-md ${getBellAnimationClass()}`}
                          ></i>
                          {notificationCount >= 0 && (
                            <span className="badge rounded-pill bg-danger border position-absolute notification-counter-badge">
                              {isBuffering ? (
                                <span className="loading-dots">
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </span>
                              ) : (
                                notificationCount
                              )}
                            </span>
                          )}
                        </span>
                      </a>
                    </li>
                  )}
                  {/* Profile icon */}
                  <li className="nav-item navbar-dropdown dropdown-user dropdown">
                    <a
                      aria-label="Profile dropdown"
                      className="nav-link dropdown-toggle hide-arrow"
                      href="#"
                      data-bs-toggle="dropdown"
                    >
                      <div className="avatar avatar-online">
                        <img
                          src={
                            user?.profilePicture ||
                            "../assets/img/avatars/avatar3.jpg"
                          }
                          className="w-px-40 h-auto rounded-circle"
                          alt="avatar"
                        />
                      </div>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <a className="dropdown-item" href="#">
                          <div className="d-flex">
                            <div className="flex-shrink-0 me-3">
                              <div className="avatar avatar-online position-relative">
                                <img
                                  src={
                                    user?.profilePicture ||
                                    "../assets/img/avatars/avatar3.jpg"
                                  }
                                  className="w-px-40 h-auto rounded-circle"
                                  alt="avatar"
                                />
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <span className="fw-medium d-block">
                                {user?.staffName}
                              </span>
                              <small className="text-muted">
                                {user?.staffId}
                              </small>
                              <br />
                              
                            </div>
                          </div>
                        </a>
                      </li>
                      <li>
                        <div className="dropdown-divider"></div>
                      </li>
                      {!isDashboardMode && (
                        <li>
                          <Link className="dropdown-item" to="/user-profile">
                            <i className="bx bx-user me-2"></i>{" "}
                            <span className="align-middle">My Profile</span>
                          </Link>
                        </li>
                      )}
                      <li>
                        <a
                          className="dropdown-item"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLogout();
                          }}
                        >
                          <i className="bx bx-power-off me-2"></i>{" "}
                          <span className="align-middle">Log Out</span>
                        </a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Notification Dropdown - Rendered outside the nav for proper positioning */}
      {showNotifications && <NotificationDropdown />}

      {showPartnerModal && (
        <PartnerSelectionModal
          show={showPartnerModal}
          onHide={() => setShowPartnerModal(false)}
        />
      )}
    </>
  );
};

export default Navbar;
