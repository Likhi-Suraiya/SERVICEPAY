// src/pages/authentication/LoginPage.jsx — ServicePay login
// Order360-style card with Partner / Staff toggle.
// Staff  -> existing loginUser (authapi) + AuthContext
// Partner -> portalLogin (portalapi) -> /portal
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthContext";
import { loginUser } from "../../api/authapi";
import { portalLogin, setPortalUser } from "../../api/portalapi";

const APP_VERSION = "1.0.0"; 

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginType, setLoginType] = useState("Partner"); 
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const browser = (() => {
    const ua = navigator.userAgent;
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    return "Browser";
  })();
  const os = navigator.userAgent.includes("Windows")
    ? "Windows"
    : navigator.userAgent.includes("Mac")
    ? "macOS"
    : navigator.userAgent.includes("Android")
    ? "Android"
    : navigator.userAgent.includes("iPhone")
    ? "iOS"
    : "OS";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userid.trim() || !password) {
      toast.warn("Enter your User ID and password");
      return;
    }
    setBusy(true);
    try {
      if (loginType === "Partner") {
        // ---------- CUSTOMER / PARTNER ----------
        const u = await portalLogin(userid.trim(), password);
        setPortalUser(u);
        navigate(u.mustChange ? "/portal/change-password" : "/portal");
      } else {
        // ---------- STAFF ----------
        const res = await loginUser({ userid: userid.trim(), password });
        if (res.successCode === "2000" && res.data) {
          toast.success("Login successful!");
          // staff-only: 3-arg login (userData, menu, rememberMe)
          login(res.data, res.menu, false);
          navigate("/blil/dashboard", { replace: true });
        } else {
          toast.error(res.successMessage || "Login failed");
        }
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.successMessage ||
          err.message ||
          "Login failed — please try again"
      );
    } finally {
      setBusy(false);
    }
  };

  const pill = (type) => ({
    flex: 1,
    padding: "9px 0",
    fontWeight: 600,
    fontSize: "14px",
    textAlign: "center",
    cursor: "pointer",
    borderRadius: "8px",
    border:
      loginType === type ? "2px solid #696cff" : "1px solid #d9dee3",
    color: loginType === type ? "#696cff" : "#697a8d",
    backgroundColor: "#fff",
    transition: "all .15s ease",
  });

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background:
          "url('/assets/img/backgrounds/bglogin.jpg') center / cover no-repeat, #eef3f8",
        padding: "16px",
      }}
    >
      <ToastContainer position="top-right" />
      <div
        className="bg-white shadow rounded-4 p-4"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        {/* Logo panel */}
        <div
          className="d-flex justify-content-center align-items-center mb-3"
          style={{ minHeight: "150px", overflow: "hidden" }}
        >
          <img
            src="/assets/img/SSP.png"
            alt="ServicePay"
            style={{ height: "120px", width: "auto", objectFit: "contain" }}
          />
        </div>

        {/* Partner / Staff toggle */}
        <div className="d-flex gap-2 mb-3">
          <div style={pill("Partner")} onClick={() => setLoginType("Partner")}>
            Partner
          </div>
          <div style={pill("Staff")} onClick={() => setLoginType("Staff")}>
            Staff
          </div>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold mb-1">User ID</Form.Label>
            <Form.Control
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              placeholder={
                loginType === "Partner" ? "Your Customer ID" : "Your Staff ID"
              }
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Form.Label className="fw-semibold mb-0">Password</Form.Label>
              <small
                className="text-primary"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  loginType === "Partner"
                    ? toast.info(
                        "Please contact the O&M office to reset your portal password."
                      )
                    : navigate("/auth/forgot-password")
                }
              >
                Forgot Password?
              </small>
            </div>
            <div className="position-relative">
              <Form.Control
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  loginType === "Partner"
                    ? "First time? Use your Customer ID"
                    : "Password"
                }
              />
              <i
                className={`bx ${showPw ? "bx-show" : "bx-hide"} position-absolute`}
                style={{
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#697a8d",
                }}
                onClick={() => setShowPw(!showPw)}
              ></i>
            </div>
          </Form.Group>

          <Button
            type="submit"
            className="w-100 fw-semibold"
            style={{ backgroundColor: "#1a75ff", border: "none", padding: "10px" }}
            disabled={busy}
          >
            {busy ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </Form>

        {/* Footer */}
        <div className="mt-3">
          <Link to="/video-gallery" className="d-block small text-primary mb-1">
            Help &amp; Support
          </Link>
          <small className="text-muted">
            OS: {os} &nbsp;|&nbsp; Browser: {browser} &nbsp;|&nbsp; V:{" "}
            {APP_VERSION} <span className="text-primary">(PRAN)</span>
          </small>
        </div>
      </div>
    </div>
  );
};
