import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./page-auth.css";
export const AuthWrapper = ({ children }) => {
  useEffect(() => {
    const host = window.location.host; // includes port when present
    const hostname = window.location.hostname; // without port
    const root = document.documentElement;

    // Use host/includes to handle ports (e.g. runner.rflgroupbd.com:5533)
    if (host.includes("runner.rflgroupbd.com") || hostname === "runner.rflgroupbd.com") {
      // Public folder assets are served from root — use absolute paths
      root.style.setProperty(
        "--bg-image",
        'url("/assets/img/backgrounds/bgi4.jpg")'
      );
    } else {
      root.style.setProperty(
        "--bg-image",
        'url("/assets/img/backgrounds/bglogin.jpg")'
      );
    }

    // Cleanup function (optional)
    return () => {
      root.style.removeProperty("--bg-image");
    };
  }, []);

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card">
            <div className="card-body">
              {/* <div className="app-brand justify-content-center">
                                <Link aria-label='Go to Home Page' to="/" className="app-brand-link gap-2">
                                    <span className="app-brand-logo demo">
                                        <img src="./public/assets/img/web do logo" alt="Web DO-logo" />
                                    </span>
                                    <span className="app-brand-text demo text-body fw-bold">Sneat</span>
                                </Link>
                            </div> */}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
