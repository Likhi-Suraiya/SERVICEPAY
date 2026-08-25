// src/pages/portal/PortalHome.jsx
import React, { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { PortalLayout } from "./PortalLayout";
import {
  getPortalSummary,
  getMyRequests,
  createServiceRequest,
  getPortalUser,
} from "../../api/portalapi";
import "./portal.css";

const PAYMENT_INSTRUCTIONS = [
  {
    method: "bKash Merchant",
    number: "01XXXXXXXXX",
    note: "Use your Customer ID as reference",
    icon: "bx-mobile",
  },
  {
    method: "Bank Transfer",
    number: "A/C 1234567890",
    note: "XYZ Bank, Gulshan Branch",
    icon: "bx-building",
  },
];

const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n)
    ? "0"
    : n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

export const PortalHome = () => {
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [saving, setSaving] = useState(false);
  const user = getPortalUser();

  const [req, setReq] = useState({
    requestType: "Emergency",
    assetType: "Lift",
    description: "",
    contactNo: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([getPortalSummary(), getMyRequests()]);
      setSummary(s);
      setRequests(r);
      setReq((p) => ({
        ...p,
        contactNo: p.contactNo || s?.contactNo || user?.contactNo || "",
      }));
    } catch (err) {
      toast.error(err.message || "Failed to load your account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitRequest = async () => {
    if (!req.description.trim()) {
      toast.warn("Please describe the problem");
      return;
    }

    setSaving(true);
    try {
      const res = await createServiceRequest(req);
      toast.success(res.successMessage || "Request received");
      setShowRequest(false);
      setReq({
        requestType: "Emergency",
        assetType: "Lift",
        description: "",
        contactNo: summary?.contactNo || user?.contactNo || "",
      });
      setRequests(await getMyRequests());
    } catch (err) {
      toast.error(err.message || "Request failed");
    } finally {
      setSaving(false);
    }
  };

  const statusClass = (status) => {
    if (status === "Closed") return "status-success";
    if (status === "Acknowledged") return "status-info";
    return "status-warning";
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="portal-loading">
          <div className="loading-ring" />
          <span>Preparing your account...</span>
        </div>
      </PortalLayout>
    );
  }

  if (!summary) {
    return (
      <PortalLayout>
        <Alert variant="warning" className="portal-alert">
          Could not load your account. Please try again.
        </Alert>
      </PortalLayout>
    );
  }

  const due = parseFloat(summary.outstanding) || 0;
  const billed = parseFloat(summary.billed) || 0;
  const paid = parseFloat(summary.paid) || 0;
  const paidPercent = billed > 0 ? Math.min(100, Math.round((paid / billed) * 100)) : 0;

  return (
    <PortalLayout>
      <ToastContainer position="top-right" />

      <section className="portal-welcome">
        <div>
          <span className="eyebrow">MY BUILDING</span>
          <h1>{summary.companyName || summary.customerName}</h1>
          <p>
            {summary.zoneName || "Service Zone"}{" "}
            {summary.fullAddress ? `· ${summary.fullAddress}` : ""}
          </p>
        </div>

        {summary.inWarranty && (
          <div className="warranty-pill">
            <i className="bx bx-check-shield" />
            <span>
              Warranty active
              <small>Until {summary.freeServiceEnd}</small>
            </span>
          </div>
        )}
      </section>

      <section className={`balance-hero ${due > 0 ? "has-due" : "clear"}`}>
        <div className="balance-copy">
          <span className="balance-label">
            {due > 0 ? "OUTSTANDING BALANCE" : "ACCOUNT STATUS"}
          </span>

          {due > 0 ? (
            <>
              <div className="balance-value">Tk {num(due)}</div>
              <p>Your account has an outstanding payment.</p>
            </>
          ) : (
            <>
              <div className="balance-value">All clear <i className="bx bx-check-circle" /></div>
              <p>No outstanding balance on your account.</p>
            </>
          )}

          {due > 0 && (
            <button className="light-action" onClick={() => document.getElementById("payment-card")?.scrollIntoView({ behavior: "smooth" })}>
              View payment options <i className="bx bx-right-arrow-alt" />
            </button>
          )}
        </div>

        <div className="balance-side">
          <div className="mini-stat">
            <span>Total billed</span>
            <strong>Tk {num(billed)}</strong>
          </div>
          <div className="mini-stat">
            <span>Total paid</span>
            <strong>Tk {num(paid)}</strong>
          </div>
          <div className="payment-progress">
            <div className="progress-label">
              <span>Payment progress</span>
              <strong>{paidPercent}%</strong>
            </div>
            <div className="progress-track">
              <div style={{ width: `${paidPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <div className="section-heading">
          <span className="eyebrow">QUICK ACCESS</span>
          <h2>What do you need?</h2>
        </div>

        <div className="quick-grid">
          <button onClick={() => (window.location.href = "/portal/history")}>
            <span className="quick-icon blue"><i className="bx bx-wrench" /></span>
            <span><strong>Services</strong><small>History & invoices</small></span>
            <i className="bx bx-chevron-right arrow" />
          </button>

          <button onClick={() => (window.location.href = "/portal/history")}>
            <span className="quick-icon green"><i className="bx bx-credit-card" /></span>
            <span><strong>Payments</strong><small>Payments & receipts</small></span>
            <i className="bx bx-chevron-right arrow" />
          </button>

          <button onClick={() => setShowRequest(true)}>
            <span className="quick-icon red"><i className="bx bx-phone-call" /></span>
            <span><strong>Request Service</strong><small>Emergency or general</small></span>
            <i className="bx bx-chevron-right arrow" />
          </button>
        </div>
      </section>

      <section className="emergency-banner" onClick={() => setShowRequest(true)}>
        <div className="emergency-icon"><i className="bx bx-bolt-circle" /></div>
        <div>
          <span className="eyebrow">NEED HELP NOW?</span>
          <h3>Something isn't working?</h3>
          <p>Send a service request and let our team take it from here.</p>
        </div>
        <i className="bx bx-right-arrow-alt emergency-arrow" />
      </section>

      {due > 0 && (
        <section id="payment-card" className="payment-card">
          <div className="section-heading inline">
            <div>
              <span className="eyebrow">PAYMENT OPTIONS</span>
              <h2>Ready to make a payment?</h2>
            </div>
            <i className="bx bx-wallet payment-heading-icon" />
          </div>

          <div className="payment-options">
            {PAYMENT_INSTRUCTIONS.map((p) => (
              <div className="payment-option" key={p.method}>
                <div className="payment-option-icon"><i className={`bx ${p.icon}`} /></div>
                <div>
                  <strong>{p.method}</strong>
                  <b>{p.number}</b>
                  <small>{p.note}</small>
                </div>
              </div>
            ))}
          </div>
          <p className="payment-note">
            <i className="bx bx-info-circle" /> A money receipt is issued for every payment. Please keep it for your records.
          </p>
        </section>
      )}

      <section className="requests-section">
        <div className="section-heading inline">
          <div>
            <span className="eyebrow">ACTIVITY</span>
            <h2>Your service requests</h2>
          </div>
          <span className="count-pill">{requests.length}</span>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            <div><i className="bx bx-inbox" /></div>
            <strong>No requests yet</strong>
            <span>Your service requests will appear here.</span>
          </div>
        ) : (
          <div className="request-list">
            {requests.slice(0, 5).map((r) => (
              <div className="request-item" key={r.requestId}>
                <div className={`request-type-icon ${r.requestType === "Emergency" ? "danger" : ""}`}>
                  <i className={r.requestType === "Emergency" ? "bx bx-bolt" : "bx bx-wrench"} />
                </div>
                <div className="request-copy">
                  <div>
                    <strong>{r.requestType}</strong>
                    <span className={`status-pill ${statusClass(r.status)}`}>{r.status}</span>
                  </div>
                  <p>{r.description}</p>
                  <small>{r.createdDate}{r.statusRemark ? ` · ${r.statusRemark}` : ""}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal show={showRequest} onHide={() => setShowRequest(false)} centered className="portal-request-modal">
        <Modal.Header closeButton>
          <div>
            <span className="eyebrow">SERVICE REQUEST</span>
            <Modal.Title>How can we help?</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="request-choice-row">
            <button
              className={req.requestType === "Emergency" ? "selected danger-choice" : ""}
              onClick={() => setReq((p) => ({ ...p, requestType: "Emergency" }))}
            >
              <i className="bx bx-bolt" />
              <span>Emergency</span>
              <small>Urgent issue</small>
            </button>
            <button
              className={req.requestType === "General" ? "selected" : ""}
              onClick={() => setReq((p) => ({ ...p, requestType: "General" }))}
            >
              <i className="bx bx-wrench" />
              <span>General</span>
              <small>Regular request</small>
            </button>
          </div>

          <Form.Group className="portal-field">
            <Form.Label>Asset</Form.Label>
            <Form.Select
              value={req.assetType}
              onChange={(e) => setReq((p) => ({ ...p, assetType: e.target.value }))}
            >
              <option value="Lift">Lift</option>
              <option value="Generator">Generator</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="portal-field">
            <Form.Label>What is the problem? <span>*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={req.description}
              onChange={(e) => setReq((p) => ({ ...p, description: e.target.value }))}
              placeholder="Tell us briefly what is happening..."
            />
          </Form.Group>

          <Form.Group className="portal-field">
            <Form.Label>Contact number</Form.Label>
            <Form.Control
              value={req.contactNo}
              onChange={(e) => setReq((p) => ({ ...p, contactNo: e.target.value }))}
              placeholder="Your registered number"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="modal-secondary" onClick={() => setShowRequest(false)}>
            Cancel
          </Button>
          <Button className="modal-primary" onClick={submitRequest} disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : <>Send request <i className="bx bx-right-arrow-alt" /></>}
          </Button>
        </Modal.Footer>
      </Modal>
    </PortalLayout>
  );
};
