// src/pages/portal/PortalHistory.jsx
import React, { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { PortalLayout } from "./PortalLayout";
import { getPortalHistory, getPortalPayments } from "../../api/portalapi";
import "./portal.css";

const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? "0" : n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

export const PortalHistory = () => {
  const [history, setHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("services");

  useEffect(() => {
    Promise.all([getPortalHistory(), getPortalPayments()])
      .then(([h, p]) => {
        setHistory(h);
        setPayments(p);
      })
      .catch((err) => toast.error(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const serviceStatus = (h) => {
    if (h.approvalStatus === "Pending") return <span className="status-pill status-warning">Processing</span>;
    if (h.invoiceNo && h.paymentStatus === "Paid") return <span className="status-pill status-success">Paid</span>;
    if (h.invoiceNo && h.paymentStatus === "Partial") return <span className="status-pill status-warning">Partial</span>;
    return <span className="status-pill status-neutral">{h.status || "Unpaid"}</span>;
  };

  return (
    <PortalLayout>
      <ToastContainer position="top-right" />

      <section className="history-header">
        <div>
          <span className="eyebrow">YOUR ACTIVITY</span>
          <h1>Services & Payments</h1>
          <p>Everything that has happened on your account.</p>
        </div>
      </section>

      <div className="history-switcher">
        <button className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}>
          <i className="bx bx-wrench" /> Services <span>{history.length}</span>
        </button>
        <button className={tab === "payments" ? "active" : ""} onClick={() => setTab("payments")}>
          <i className="bx bx-credit-card" /> Payments <span>{payments.length}</span>
        </button>
      </div>

      {loading ? (
        <div className="portal-loading">
          <div className="loading-ring" />
          <span>Loading your activity...</span>
        </div>
      ) : tab === "services" ? (
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-state">
              <div><i className="bx bx-wrench" /></div>
              <strong>No services yet</strong>
              <span>Your completed and ongoing services will appear here.</span>
            </div>
          ) : (
            history.map((h, i) => (
              <article className="service-card" key={i}>
                <div className="service-date">
                  <strong>{h.serviceDate}</strong>
                  <span>{h.serviceMonth || "SERVICE"}</span>
                </div>

                <div className="service-main">
                  <div className="service-topline">
                    <div>
                      <span className="service-icon"><i className="bx bx-wrench" /></span>
                      <div>
                        <h3>{h.serviceType || "Service"}</h3>
                        <p>{h.itemsSummary || "Service visit"}{h.invoiceNo ? ` · ${h.invoiceNo}` : ""}</p>
                      </div>
                    </div>
                    {serviceStatus(h)}
                  </div>

                  <div className="service-meta">
                    <span><i className="bx bx-user" /> {h.technician || "Technician not assigned"}</span>
                    <strong>Tk {num(h.cost)}</strong>
                  </div>

                  <div className="service-actions">
                    {h.invoiceNo && <button><i className="bx bx-file" /> Invoice</button>}
                    {h.invoiceNo && <button><i className="bx bx-receipt" /> Receipt</button>}
                    <button className="details-btn"><i className="bx bx-chevron-right" /> Details</button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="payment-history-list">
          {payments.length === 0 ? (
            <div className="empty-state">
              <div><i className="bx bx-credit-card" /></div>
              <strong>No payments yet</strong>
              <span>Your payment receipts will appear here.</span>
            </div>
          ) : (
            payments.map((p, i) => (
              <article className="payment-history-card" key={i}>
                <div className="payment-success-icon"><i className="bx bx-check" /></div>
                <div className="payment-history-copy">
                  <span className="eyebrow">{p.payDate}</span>
                  <h3>Tk {num(p.amount)}</h3>
                  <p>{p.method || "Payment"} · Invoice {p.invoiceNo || "-"}</p>
                  <small>{p.serviceMonth || "Service payment"}</small>
                </div>
                <button title="View receipt"><i className="bx bx-receipt" /></button>
              </article>
            ))
          )}
        </div>
      )}
    </PortalLayout>
  );
};
