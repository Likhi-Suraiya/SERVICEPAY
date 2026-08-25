import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./page-auth.css";
import { AuthWrapper } from "./AuthWrapper";
import { loginUser } from "../../api/authapi";
import { useAuth } from "../../context/AuthContext";
import ThreeStringLoader from "../../components/loader/ThreeStringLoader";
import { portalLogin, setPortalUser } from "../../api/portalapi"; 
import {
  getBrowserName,
  getOSName,
  getDeviceType,
  fetchIPAddress,
} from "../../utils/deviceInfo";

export const LoginPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    userid: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    os: "Unknown",
    device: "Unknown",
    browser: "Unknown",
    ip: "Unknown",
  });

  const [loginType, setLoginType] = useState("Staff");

  const navigate = useNavigate();

  // Fetch device info (display only)
  useEffect(() => {
    const loadDeviceInfo = async () => {
      try {
        const ip = await fetchIPAddress();
        setDeviceInfo({
          os: getOSName(),
          device: getDeviceType(),
          browser: getBrowserName(),
          ip,
        });
      } catch (error) {
        console.error("Error loading device info:", error);
        setDeviceInfo({
          os: getOSName(),
          device: getDeviceType(),
          browser: getBrowserName(),
          ip: "Unknown",
        });
      }
    };
    loadDeviceInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.userid) newErrors.userid = "Staff ID is required";
    if (!formData.password) newErrors.password = "Password is required";
    return newErrors;
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      // --- PARTNER LOGIN ---
      if (loginType === "Partner") {
        try {
          const user = await portalLogin(formData.userid, formData.password);
          setPortalUser(user);
          
          toast.success("Partner login successful!");
          
          // Check if password change is required
          if (user.mustChangeYn === "Y") {
            navigate("/portal/change-password");
          } else {
            navigate("/portal");
          }
          return; // Exit early - staff flow untouched below
        } catch (portalError) {
          toast.error(portalError.message || "Invalid customer ID or password");
          setIsLoading(false);
          return;
        }
      }

      // --- STAFF LOGIN (existing logic) ---
      const response = await loginUser({
        userid: formData.userid,
        password: formData.password,
      });
      console.log("Login response:", response);

      if (response.successCode === "2000") {
        toast.success("Login successful!");
        // staff-only: 3-arg login (userData, menu, rememberMe)
        login(response.data, response.menu, formData.rememberMe);
        navigate("/blil/dashboard");
      } else {
        toast.error(response.successMessage || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        const d = error.response.data;
        toast.error(
          d?.successMessage || d?.SuccessMessage || d?.message || "Login failed. Please try again."
        );
      } else {
        toast.error("Cannot reach the server. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add login type toggle UI (optional - add this if you want a switcher)
  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    // Clear form fields when switching
    setFormData({
      userid: "",
      password: "",
      rememberMe: false,
    });
    setErrors({});
  };

  return (
    <div className="login-page-wrapper">
      {isLoading && <ThreeStringLoader />}
      <ToastContainer position="top-right" />
      <AuthWrapper>
        <div className="text-center mb-4">
          <img
            src="/assets/img/SSP.png"
            alt="ServicePay - Billing Made Simple"
            className="img-fluid"
            style={{ 
              width: "900px", 
              height: "100px",
              objectFit: "contain"
            }}
          />
        </div>

        {/* Login Type Toggle */}
        <div className="login-type-toggle mb-3 d-flex justify-content-center gap-3">
          <button
            type="button"
            className={`btn btn-sm ${loginType === "Staff" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => handleLoginTypeChange("Staff")}
          >
            Staff Login
          </button>
          <button
            type="button"
            className={`btn btn-sm ${loginType === "Partner" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => handleLoginTypeChange("Partner")}
          >
            Partner Login
          </button>
        </div>

        <form
          id="formAuthentication"
          className="mb-3"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="mb-3">
            <label htmlFor="userid" className="form-label">
              {loginType === "Partner" ? "Customer ID" : "Staff ID"}
            </label>
            <input
              type="text"
              className={`form-control${errors.userid ? " is-invalid" : ""}`}
              id="userid"
              value={formData.userid}
              onChange={handleChange}
              name="userid"
              placeholder={loginType === "Partner" ? "Customer ID" : "Staff ID"}
              autoFocus
            />
            {errors.userid && (
              <div className="invalid-feedback">{errors.userid}</div>
            )}
          </div>

          <div className="mb-3 form-password-toggle">
            <div className="d-flex justify-content-between">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              {loginType === "Staff" && (
                <Link
                  aria-label="Go to Forgot Password Page"
                  to="/auth/forgot-password"
                >
                  <small>Forgot Password?</small>
                </Link>
              )}
            </div>
            <div className="input-group input-group-merge">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="true"
                id="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control${errors.password ? " is-invalid" : ""}`}
                name="password"
                placeholder={loginType === "Partner" ? "Enter Password" : "Enter HRIS Password"}
                aria-describedby="password"
              />
              <span
                className="input-group-text cursor-pointer"
                onClick={togglePasswordVisibility}
                style={{ cursor: "pointer" }}
              >
                <i className={`bx ${showPassword ? "bx-show" : "bx-hide"}`}></i>
              </span>
              {errors.password && (
                <div className="invalid-feedback d-block">{errors.password}</div>
              )}
            </div>
          </div>

          <div className="mb-3" style={{ display: "none" }}>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="remember-me"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="remember-me">
                Remember Me
              </label>
            </div>
          </div>

          <div className="mb-3">
            <button
              aria-label="Sign in"
              className="btn btn-primary d-grid w-100"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                `Sign in as ${loginType}`
              )}
            </button>
          </div>

          <div>
            <Link to="/video-gallery">
              <small>Help & Support</small>
            </Link>
          </div>

          {deviceInfo && (
            <div className="device-info d-flex flex-wrap gap-2 mt-2 text-normal small">
              <small className="border-end pe-3">
                <span className="fw-semibold">OS:</span> {deviceInfo.os}
              </small>
              <small className="border-end pe-3">
                <span className="fw-semibold">Device:</span> {deviceInfo.device}
              </small>
              <small className="border-end pe-3">
                <span className="fw-semibold">Browser:</span> {deviceInfo.browser}
              </small>
              <small className="d-none">
                <span className="fw-semibold">IP:</span> {deviceInfo.ip}
              </small>
              <small>
                <span className="fw-semibold">V:</span> 3.4.8
              </small>
            </div>
          )}
        </form>
      </AuthWrapper>
    </div>
  );
};