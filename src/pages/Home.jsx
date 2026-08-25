// src/pages/Home.jsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EnhancedAnimatedButton } from "../components/animated-button/EnhancedAnimatedButton";
import { GlowButton } from "../components/animated-button/GlowButton";

export const Home = () => {
  const { user, userType, menuData, disableDashboardMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    disableDashboardMode();
  }, [disableDashboardMode]);

  // Get first available menu item for quick navigation
  const getFirstAvailableRoute = () => {
    const allItems =
      menuData?.flatMap((section) =>
        section.items.flatMap((item) =>
          item.submenu ? [item, ...item.submenu] : [item],
        ),
      ) || [];

    const availableItem = allItems.find(
      (item) => item.available && item.link !== "/home",
    );
    return availableItem?.link || "/";
  };

  // Navigate to user profile with distLogistic tab active
  const handleLogisticsClick = () => {
    navigate("/user-profile", { state: { activeTab: "distLogistic" } });
  };

  const handleQuickStart = () => {
    const firstRoute = getFirstAvailableRoute();
    navigate(firstRoute);
  };

  return (
    <div className="row">
      <div className="col-12 mb-4">
        <div className="card bg-graduate">
          <div className="card-body py-3">
            <div
              className="card mb-4 border-0 text-white"
              style={{
                background:
                  "linear-gradient(135deg, #c2c9ebff 0%, #8a69aaff 100%)",
              }}
            >
              <div className="card-body">
                <div className="row">
                  <div className="col-8 col-md-8">
                    <h3>Welcome to Order360</h3>
                  </div>
                  <div className="col-4 col-md-4 text-end">
                    <i className="bx bx-rocket bx-lg opacity-50"></i>
                  </div>
                </div>

                <div className="bg-light-warning border-0">
                  <div className="d-flex align-items-center">
                    <div>
                      <div className="alert alert-danger mb-3" role="alert">
                        <h5 className="alert-heading mb-1 d-flex align-items-center gap-2">
                          <span className="alert-icon rounded-circle">
                            <i className="icon-base bx bx-error icon-md"></i>
                          </span>
                          <span>Important Notice!</span>
                        </h5>
                        <br />
                        <ul>
                          <li>
                            <span className="ms-11 ps-1">
                              কোম্পানির সিদ্ধান্ত অনুযায়ী জানুয়ারি থেকে
                              পরিবেশকের লিফটিং-এর বিপরীতে ডিএসআরদের প্রতি লাখে
                              ২৫০/- টাকা সেলস কমিশন কার্যকর করা হয়েছে
                            </span>
                          </li>
                          <li>
                            <span className="ms-11 ps-1">
                              কোম্পানির কর্মকর্তা ও কর্মচারীদের সাথে কোনো প্রকার
                              আর্থিক লেনদেন কঠোরভাবে নিষিদ্ধ।
                            </span>
                          </li>
                        </ul>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="row"
              // style={{ gap: "", marginLeft: "0.8rem" }}
            >
              <div className="col-6 col-lg-2 mb-3">
                <GlowButton
                  onClick={() => navigate("/opening-stock")}
                  variant="danger"
                  size="small"
                  className="text-nowrap"
                >
                  Ope. Stock
                </GlowButton>
              </div>

              <div className="col-6 mb-3">
                <GlowButton
                  onClick={handleLogisticsClick}
                  variant="success"
                  size="small"
                >
                  Logistics
                </GlowButton>
              </div>
            </div>

            {/* <div className="row" style={{ gap: "1rem", marginLeft: "0.8rem" }}>
              <div className="col-6 col-md-4 col-lg-2 mb-3">
                <EnhancedAnimatedButton
                  onClick={() => navigate('/opening-stock')}
                  variant="danger"
                  size="small"
                >
                  Opening Stock
                </EnhancedAnimatedButton>
              </div>

              <div className="col-6 col-md-4 col-lg-2 mb-3">
                <EnhancedAnimatedButton
                  onClick={() => navigate('/user-profile')}
                  variant="success"
                  size="small"
                >
                  Logistics
                </EnhancedAnimatedButton>
              </div>
            </div> */}

            <div className="row">
              <div className="col-6 col-md-3 mb-3">
                <Link to="/order-entry-q">
                  <div className="card bg-primary card-hover-sm">
                    <div className="card-body text-center">
                      <i className="bx bx-cart-add bx-lg text-white mb-3"></i>
                      <h5 className="text-white">Order Entry</h5>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="col-6 col-md-3 mb-3">
                <Link to="/order-active">
                  <div className="card bg-danger card-hover-sm">
                    <div className="card-body text-center">
                      <i className="bx bx-list-check bx-lg text-white mb-3"></i>
                      <h5 className="text-white">Order Active</h5>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="col-6 col-md-3 mb-2">
                <Link to="/demand-entry">
                  <div className="card bg-info card-hover-sm">
                    <div className="card-body text-center">
                      <i className="bx bx-package bx-lg text-white mb-3"></i>
                      <h5 className="text-white">Demand Entry</h5>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="col-6 col-md-3 mb-2">
                <Link to="/demand-active">
                  <div className="card bg-warning card-hover-sm">
                    <div className="card-body text-center">
                      <i className="bx bx-task bx-lg text-white mb-3"></i>
                      <h5 className="text-white">Demand Active</h5>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
