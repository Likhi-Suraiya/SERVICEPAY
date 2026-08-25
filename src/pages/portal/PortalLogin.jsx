// src/pages/portal/PortalLogin.jsx
import React, { useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { portalLogin, setPortalUser } from "../../api/portalapi";
import "./portal.css";

export const PortalLogin = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !password) {
      setError("Please enter your Customer ID and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await portalLogin(userId.trim(), password);
      setPortalUser(data);
      navigate(data.mustChange ? "/portal/change-password" : "/portal", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-login-page">
      <div className="portal-login-art">
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />

        <div className="login-brand-large">
          <span className="portal-brand-mark large">
            <i className="bx bx-building-house" />
          </span>
          <div>
            <strong>BLIL</strong>
            <span>Building Care</span>
          </div>
        </div>

        <div className="login-art-copy">
          <span className="eyebrow">YOUR BUILDING. YOUR SERVICE.</span>
          <h1>Everything your building needs, in one place.</h1>
          <p>
            Track services, payments and maintenance requests without calling
            the office for every update.
          </p>

          <div className="login-benefits">
            <div><i className="bx bx-receipt" /> View invoices & payments</div>
            <div><i className="bx bx-wrench" /> Track service history</div>
            <div><i className="bx bx-bell" /> Request urgent service</div>
          </div>
        </div>
      </div>

      <div className="portal-login-panel">
        <div className="login-panel-inner">
          <div className="mobile-login-brand">
            <span className="portal-brand-mark large">
              <i className="bx bx-building-house" />
            </span>
            <div>
              <strong>BLIL</strong>
              <span>Building Care</span>
            </div>
          </div>

          <span className="eyebrow">PARTNER PORTAL</span>
          <h2>Welcome back</h2>
          <p className="login-subtitle">
            Sign in to manage your building services.
          </p>

          {error && (
            <Alert variant="danger" className="portal-alert">
              <i className="bx bx-error-circle" /> {error}
            </Alert>
          )}

          <Form onSubmit={submit}>
            <Form.Group className="portal-field">
              <Form.Label>Customer ID</Form.Label>
              <div className="portal-input-wrap">
                <i className="bx bx-id-card" />
                <Form.Control
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your Customer ID"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </Form.Group>

            <Form.Group className="portal-field">
              <div className="field-label-row">
                <Form.Label>Password</Form.Label>
              </div>
              <div className="portal-input-wrap">
                <i className="bx bx-lock-alt" />
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`bx ${showPassword ? "bx-hide" : "bx-show"}`} />
                </button>
              </div>
            </Form.Group>

            <Button type="submit" className="portal-primary-btn" disabled={loading}>
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                <>
                  Sign in <i className="bx bx-right-arrow-alt" />
                </>
              )}
            </Button>
          </Form>

          <div className="login-help">
            <i className="bx bx-shield-quarter" />
            Your account is protected by secure customer authentication.
          </div>

          <a href="/" className="staff-login-link">
            <i className="bx bx-arrow-back" /> Staff login
          </a>
        </div>
      </div>
    </div>
  );
};
