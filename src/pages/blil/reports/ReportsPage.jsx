// src/pages/blil/reports/ReportsPage.jsx — landing grid for all reports
import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const REPORTS = [
  { title: "Monthly Collection", desc: "Payments received: date, method, receiver", icon: "bx bx-money", link: "/blil/reports/collection", color: "#055fae" },
  { title: "Outstanding Dues", desc: "Who owes, how much, with 30/60/90 day aging", icon: "bx bx-error-circle", link: "/blil/reports/dues", color: "#c0392b" },
  { title: "Service Completion", desc: "Scheduled vs completed vs due per month", icon: "bx bx-check-circle", link: "/blil/reports/service", color: "#27ae60" },
  { title: "Advance Ledger", desc: "Advance taken, adjusted, remaining per customer", icon: "bx bx-wallet", link: "/blil/reports/advance", color: "#8e44ad" },
  { title: "Zone Summary", desc: "Per zone: customers, billed, collected, outstanding", icon: "bx bx-map", link: "/blil/reports/zone", color: "#d35400" },
  { title: "Customer Statement", desc: "One customer's full ledger with running balance", icon: "bx bx-user-circle", link: "/blil/reports/customer", color: "#16a085" },
];

export const ReportsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="p-3">
      <h5 className="mb-3">
        <i className="bx bx-file me-2"></i>Reports
      </h5>
      <Row className="g-3">
        {REPORTS.map((r) => (
          <Col xs={12} md={4} key={r.link}>
            <Card
              className="shadow-sm h-100"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(r.link)}
            >
              <Card.Body className="d-flex align-items-start gap-3">
                <div
                  className="rounded d-flex align-items-center justify-content-center"
                  style={{ width: 44, height: 44, backgroundColor: r.color, color: "#fff", fontSize: 22 }}
                >
                  <i className={r.icon}></i>
                </div>
                <div>
                  <div className="fw-bold">{r.title}</div>
                  <small className="text-muted">{r.desc}</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};
