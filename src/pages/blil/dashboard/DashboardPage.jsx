// src/pages/blil/dashboard/DashboardPage.jsx — BLIL landing dashboard
// Notice board is STATIC: edit the NOTICES constant below and redeploy
// the frontend. No API involved.
import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col, Badge, Table, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  getCollectionReport,
  getDuesReport,
  getServiceCompletionReport,
} from "../../../api/reportapi";
import { getStaffRequests } from "../../../api/portalapi";
import { num, monthStart, today } from "../reports/ReportShell";

// =====================================================================
// >>> OFFICIAL NOTICES — edit here <<<
// priority: "important" (red panel) | "normal" (grey panel)
// Keep the newest notice first. Remove old ones by deleting the block.
// Bangla text works as-is.
// =====================================================================
const NOTICES = [
  {
    date: "2026-07-29",
    priority: "important",
    title: "Important Notice!",
    lines: [
      "সার্ভিস সম্পন্ন হওয়ার সাথে সাথে ইনভয়েস তৈরি এবং মানি রিসিট প্রদান বাধ্যতামূলক।",
      "কোম্পানির কর্মকর্তা ও কর্মচারীদের সাথে কোনো প্রকার ব্যক্তিগত আর্থিক লেনদেন কঠোরভাবে নিষিদ্ধ।",
    ],
  },
  // {
  //   date: "2026-08-01",
  //   priority: "normal",
  //   title: "Office Notice",
  //   lines: ["Example second notice — uncomment to show."],
  // },
];

const TILES = [
  { title: "Service Entry", icon: "bx bx-wrench", color: "#696cff", link: "/blil/services" },
  { title: "Receive Payment", icon: "bx bx-money", color: "#ff3e1d", link: "/blil/payments" },
  { title: "New Customer", icon: "bx bx-user-plus", color: "#03c3ec", link: "/blil/owners" },
  { title: "Reports", icon: "bx bx-file", color: "#ffab00", link: "/blil/reports" },
];

// animate a number from 0 to target once loading finishes
const useCountUp = (target, ready, duration = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!ready) return;
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ready, duration]);
  return val;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.userName || user?.username || user?.userId || "";

  const [collection, setCollection] = useState([]);
  const [dues, setDues] = useState([]);
  const [completion, setCompletion] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = monthStart();
    const to = today();
    Promise.allSettled([
      getCollectionReport({ from, to }),
      getDuesReport({}),
      getServiceCompletionReport({ from, to }),
      getStaffRequests("Open"),
    ]).then(([c, d, s, r]) => {
      if (c.status === "fulfilled") setCollection(c.value);
      if (d.status === "fulfilled") setDues(d.value);
      if (s.status === "fulfilled") setCompletion(s.value);
      if (r.status === "fulfilled") setOpenRequests(r.value);
      setLoading(false);
    });
  }, []);

  const kpi = useMemo(() => {
    const collected = collection.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const receivable = dues.reduce((s, r) => s + (parseFloat(r.due) || 0), 0);
    const svc = completion.reduce(
      (a, r) => ({
        total: a.total + (parseInt(r.total) || 0),
        completed: a.completed + (parseInt(r.completed) || 0),
        pending: a.pending + (parseInt(r.overdue) || 0),
        upcoming: a.upcoming + (parseInt(r.upcoming) || 0),
      }),
      { total: 0, completed: 0, pending: 0, upcoming: 0 }
    );
    return { collected, receivable, svc };
  }, [collection, dues, completion]);

  const topDues = useMemo(
    () =>
      [...dues]
        .sort((a, b) => (parseFloat(b.due) || 0) - (parseFloat(a.due) || 0))
        .slice(0, 5),
    [dues]
  );

  const recentPayments = useMemo(
    () => [...collection].reverse().slice(0, 6),
    [collection]
  );

  const monthLabel = new Date().toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });

  // live clock in the banner
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // animated KPI figures
  const aCollected = useCountUp(kpi.collected, !loading);
  const aReceivable = useCountUp(kpi.receivable, !loading);
  const aCompleted = useCountUp(kpi.svc.completed, !loading);
  const aTotal = useCountUp(kpi.svc.total, !loading);
  const aPending = useCountUp(kpi.svc.pending, !loading);

  return (
    <div className="p-3">
      <style>{`
        .blil-tile {
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
        }
        .blil-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 18px rgba(0,0,0,.25) !important;
          filter: brightness(1.06);
        }
        .blil-tile:hover i {
          transform: scale(1.15);
        }
        .blil-tile i {
          transition: transform .18s ease;
        }
        @keyframes blilFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
        .blil-anim { animation: blilFadeUp .5s ease both; }
        .blil-anim-late { animation: blilFadeUp .5s ease .25s both; }
        @keyframes blilPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.2); }
        }
        .blil-pulse { display: inline-block; animation: blilPulse 1.6s ease-in-out infinite; }
      `}</style>

      {/* ---------- Welcome + Notice board ---------- */}
      <Card
        className="shadow-sm mb-3 blil-anim"
        style={{ background: "linear-gradient(135deg, #055fae 0%, #6f42c1 100%)" }}
      >
        <Card.Body className="py-3">
          <div className="d-flex justify-content-between align-items-center text-white mb-2">
            <h5 className="mb-0">Welcome to Property Lift Service Management</h5>
            <div className="text-end">
              <small className="d-block">
                {greeting()}
                {displayName ? `, ${displayName}` : ""}!
              </small>
              <span
                className="badge bg-light text-dark mt-1"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                <i className="bx bx-time-five me-1"></i>
                {now.toLocaleTimeString()}
              </span>
            </div>
          </div>
          {NOTICES.map((n, i) => (
            <div
              key={i}
              className="rounded p-3 mb-2"
              style={{
                backgroundColor: n.priority === "important" ? "#fde2dd" : "#f1f1f4",
              }}
            >
              <div className="d-flex justify-content-between">
                <strong
                  style={{
                    color: n.priority === "important" ? "#c0392b" : "#444",
                  }}
                >
                  <i className={`bx bx-error me-1 ${n.priority === "important" ? "blil-pulse" : ""}`}></i>
                  {n.title}
                </strong>
                <small className="text-muted">{n.date}</small>
              </div>
              <ul className="mb-0 mt-1" style={{ color: "#333" }}>
                {n.lines.map((l, j) => (
                  <li key={j}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </Card.Body>
      </Card>

      {/* ---------- Open service calls alert ---------- */}
      {openRequests.length > 0 && (
        <Card
          className="shadow-sm mb-3 border-danger blil-anim"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/blil/requests")}
        >
          <Card.Body className="py-2 d-flex justify-content-between align-items-center">
            <strong className="text-danger">
              <i className="bx bx-phone-call me-2 blil-pulse"></i>
              {openRequests.length} open service call
              {openRequests.length > 1 ? "s" : ""} from customers
              {openRequests.some((r) => r.reqType === "Emergency") &&
                " — including EMERGENCY"}
            </strong>
            <span className="text-danger">
              View requests <i className="bx bx-right-arrow-alt"></i>
            </span>
          </Card.Body>
        </Card>
      )}

      {/* ---------- Quick action tiles ---------- */}
      <Row className="g-3 mb-3">
        {TILES.map((t, i) => (
          <Col xs={6} md={3} key={t.link}>
            <Card
              className="shadow-sm text-center text-white h-100 blil-tile blil-anim"
              style={{
                backgroundColor: t.color,
                cursor: "pointer",
                animationDelay: `${120 + i * 90}ms`,
              }}
              onClick={() => navigate(t.link)}
            >
              <Card.Body className="py-3">
                <i className={t.icon} style={{ fontSize: "28px" }}></i>
                <div className="fw-bold mt-1">{t.title}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ---------- KPI row ---------- */}
      <Row className="g-3 mb-3">
        <Col xs={6} md={3}>
          <Card className="shadow-sm h-100 blil-anim-late">
            <Card.Body className="py-2 text-center">
              <small className="text-muted d-block">Collected — {monthLabel}</small>
              {loading ? <Spinner size="sm" animation="border" /> : (
                <>
                  <strong className="text-success fs-5">Tk {num(Math.round(aCollected))}</strong>
                  <small className="d-block text-muted">{collection.length} payments</small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="shadow-sm h-100 blil-anim-late">
            <Card.Body className="py-2 text-center">
              <small className="text-muted d-block">Total Receivable</small>
              {loading ? <Spinner size="sm" animation="border" /> : (
                <>
                  <strong className="text-danger fs-5">Tk {num(Math.round(aReceivable))}</strong>
                  <small className="d-block text-muted">{dues.length} customers</small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="shadow-sm h-100 blil-anim-late">
            <Card.Body className="py-2 text-center">
              <small className="text-muted d-block">Services — {monthLabel}</small>
              {loading ? <Spinner size="sm" animation="border" /> : (
                <>
                  <strong className="fs-5">
                    {Math.round(aCompleted)} / {Math.round(aTotal)}
                  </strong>
                  <small className="d-block text-muted">completed / scheduled</small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="shadow-sm h-100 blil-anim-late">
            <Card.Body className="py-2 text-center">
              <small className="text-muted d-block">Pending Services</small>
              {loading ? <Spinner size="sm" animation="border" /> : (
                <>
                  <strong className="fs-5" style={{ color: "#b8860b" }}>
                    {Math.round(aPending)}
                  </strong>
                  <small className="d-block text-muted">{kpi.svc.upcoming} upcoming</small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ---------- Queues ---------- */}
      {/* <Row className="g-3">
        <Col xs={12} md={6}>
          <Card className="shadow-sm h-100 blil-anim-late">
            <Card.Header className="py-2 d-flex justify-content-between align-items-center">
              <strong><i className="bx bx-error-circle me-1"></i>Top Receivables</strong>
              <small
                className="text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/blil/reports/collection-dues")}
              >
                View all <i className="bx bx-right-arrow-alt"></i>
              </small>
            </Card.Header>
            <Card.Body className="py-2">
              <Table size="sm" borderless className="mb-0">
                <tbody>
                  {loading ? (
                    <tr><td className="text-center py-2"><Spinner size="sm" animation="border" /></td></tr>
                  ) : topDues.length === 0 ? (
                    <tr><td className="text-center text-muted py-2">No receivables — all settled</td></tr>
                  ) : (
                    topDues.map((r, i) => (
                      <tr
                        key={i}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(`/blil/reports/customer?customerId=${r.customerId}`)
                        }
                      >
                        <td>
                          {r.companyName}
                          <small className="d-block text-muted">
                            {r.zoneName || "-"} · {r.customerId}
                          </small>
                        </td>
                        <td className="text-end align-middle">
                          <strong className="text-danger">Tk {num(r.due)}</strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card className="shadow-sm h-100 blil-anim-late">
            <Card.Header className="py-2 d-flex justify-content-between align-items-center">
              <strong><i className="bx bx-receipt me-1"></i>Recent Payments</strong>
              <small
                className="text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/blil/payments")}
              >
                Payment page <i className="bx bx-right-arrow-alt"></i>
              </small>
            </Card.Header>
            <Card.Body className="py-2">
              <Table size="sm" borderless className="mb-0">
                <tbody>
                  {loading ? (
                    <tr><td className="text-center py-2"><Spinner size="sm" animation="border" /></td></tr>
                  ) : recentPayments.length === 0 ? (
                    <tr><td className="text-center text-muted py-2">No payments yet this month</td></tr>
                  ) : (
                    recentPayments.map((r, i) => (
                      <tr key={i}>
                        <td>
                          {r.companyName}
                          <small className="d-block text-muted">
                            {r.payDate} · {r.method || "-"}
                          </small>
                        </td>
                        <td className="text-end align-middle">
                          <Badge bg="success">Tk {num(r.amount)}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row> */}
    </div>
  );
};
