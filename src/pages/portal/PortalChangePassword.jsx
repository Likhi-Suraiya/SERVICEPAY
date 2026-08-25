// src/pages/portal/PortalChangePassword.jsx — forced on first login
import React, { useState } from "react";
import { Card, Form, Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { PortalLayout } from "./PortalLayout";
import {
  portalChangePassword,
  getPortalUser,
  setPortalUser,
} from "../../api/portalapi";

export const PortalChangePassword = () => {
  const navigate = useNavigate();
  const user = getPortalUser();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.trim().length < 4)
      return setError("New password must be at least 4 characters");
    if (newPassword !== confirm) return setError("Passwords do not match");
    setLoading(true);
    try {
      await portalChangePassword(oldPassword, newPassword.trim());
      setPortalUser({ ...user, mustChange: false });
      navigate("/portal", { replace: true });
    } catch (err) {
      setError(err.message || "Change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout>
      <Card className="shadow-sm mx-auto" style={{ maxWidth: "420px" }}>
        <Card.Header className="py-2">
          <strong>Set Your Password</strong>
        </Card.Header>
        <Card.Body>
          {user?.mustChange && (
            <Alert variant="info" className="py-2">
              For your security, please set a new password before continuing.
            </Alert>
          )}
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}
          <Form onSubmit={submit}>
            <Form.Group className="mb-2">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="First time? Your Customer ID"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Form.Group>
            <Button
              type="submit"
              className="w-100"
              style={{ backgroundColor: "#055fae" }}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" animation="border" /> : "Save Password"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </PortalLayout>
  );
};
